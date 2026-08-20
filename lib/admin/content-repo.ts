import type { EnvProblem } from "../env";
import type { AdminEnv } from "./password";

/**
 * Reads and writes `content/site-content.json` through the GitHub Contents API.
 *
 * The site has no database: content is a JSON file in the repo, baked into
 * static pages at build time. So "saving" an edit means committing the file
 * and letting Vercel rebuild. That costs a minute or two of latency, and buys
 * a lot back — the repo stays the single source of truth, every edit lands in
 * git history as an audit trail of who changed a practitioner's credentials
 * and when, and the `needsVerification` build gate keeps working because it
 * still runs over the real content.
 *
 * Reads go to GitHub rather than to the JSON bundled into this deployment.
 * The bundled copy is only accurate as of the last build, so two edits in
 * quick succession would compute the second one against stale data and silently
 * revert the first. Reading live also yields the blob SHA, which is what makes
 * the write safe: GitHub rejects a PUT whose SHA no longer matches, so two
 * people editing at once get a conflict they can see instead of one quietly
 * overwriting the other.
 */

export const CONTENT_PATH = "content/site-content.json";

const API_ROOT = "https://api.github.com";
const TIMEOUT_MS = 10_000;

export type RepoConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  /** API root. Overridable for GitHub Enterprise Server, and for pointing a
   *  local build at a stub while verifying the editing screens. */
  apiRoot: string;
};

/**
 * Repository credentials, or null when the portal is read-only.
 *
 * `GITHUB_REPO` is `owner/name`. The branch defaults to `main`, which is what
 * Vercel builds for production; a deployment pointed at another branch can
 * override it so a preview portal edits its own branch rather than production
 * content.
 */
export function repoConfig(env: AdminEnv = process.env): RepoConfig | null {
  const token = env.CONTENT_GITHUB_TOKEN?.trim();
  const slug = env.CONTENT_GITHUB_REPO?.trim();
  if (!token || !slug) return null;

  const [owner, repo] = slug.split("/");
  if (!owner || !repo) return null;

  return {
    token,
    owner,
    repo,
    branch: env.CONTENT_GITHUB_BRANCH?.trim() || "main",
    apiRoot: (env.CONTENT_GITHUB_API_URL?.trim() || API_ROOT).replace(/\/$/, ""),
  };
}

/** Whether edits can be saved at all. The screens stay readable when false,
 *  so the portal degrades to a viewer rather than a page of dead buttons. */
export function contentEditingConfigured(env: AdminEnv = process.env): boolean {
  return repoConfig(env) !== null;
}

/**
 * Configuration problems worth failing a production build over.
 *
 * Leaving content editing off is fine — the portal degrades to a viewer. What
 * is not fine is setting one variable and not the other, because the portal
 * then renders working-looking Save buttons that fail on click, which reads as
 * a broken portal rather than a missing setting.
 */
export function collectContentEnvProblems(env: AdminEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const token = env.CONTENT_GITHUB_TOKEN?.trim();
  const slug = env.CONTENT_GITHUB_REPO?.trim();

  if (!token && !slug) return problems;

  if (token && !slug) {
    problems.push({
      variable: "CONTENT_GITHUB_REPO",
      problem: "is required whenever CONTENT_GITHUB_TOKEN is set — give it as owner/repo",
    });
  }
  if (!token && slug) {
    problems.push({
      variable: "CONTENT_GITHUB_TOKEN",
      problem: "is required whenever CONTENT_GITHUB_REPO is set, or the portal cannot save",
    });
  }
  if (slug && !/^[\w.-]+\/[\w.-]+$/.test(slug)) {
    problems.push({
      variable: "CONTENT_GITHUB_REPO",
      problem: `must be in owner/repo form (got ${JSON.stringify(slug)})`,
    });
  }

  return problems;
}

function headers(config: RepoConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "kinetic-therapy-staff-portal",
  };
}

export type LoadedContent = { json: unknown; sha: string };

/** Anything the caller can act on is a `ContentRepoError`; the message is
 *  written to be shown to a receptionist, not to a developer. */
export class ContentRepoError extends Error {
  constructor(message: string, readonly conflict = false) {
    super(message);
    this.name = "ContentRepoError";
  }
}

/** Fetches the current content file and its blob SHA. */
export async function loadContent(config: RepoConfig): Promise<LoadedContent> {
  const url =
    `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${CONTENT_PATH}` +
    `?ref=${encodeURIComponent(config.branch)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: headers(config),
      // The file changes on every save, and a cached read would hand back a
      // stale SHA that fails the next write.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ContentRepoError("Couldn't reach GitHub. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new ContentRepoError(
      "GitHub rejected the access token. It may have expired or lost access to the repository."
    );
  }
  if (response.status === 404) {
    throw new ContentRepoError(
      `Couldn't find ${CONTENT_PATH} on the ${config.branch} branch of ${config.owner}/${config.repo}.`
    );
  }
  if (!response.ok) {
    throw new ContentRepoError(`GitHub responded ${response.status} while reading the content file.`);
  }

  const payload = (await response.json()) as { content?: string; encoding?: string; sha?: string };
  if (typeof payload.sha !== "string" || typeof payload.content !== "string") {
    throw new ContentRepoError("GitHub returned an unexpected response for the content file.");
  }

  let text: string;
  try {
    text = Buffer.from(payload.content, "base64").toString("utf8");
  } catch {
    throw new ContentRepoError("Couldn't decode the content file.");
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ContentRepoError(
      "The content file in the repository isn't valid JSON. It needs fixing by hand before the portal can edit it."
    );
  }

  return { json, sha: payload.sha };
}

/**
 * Commits a new version of the content file.
 *
 * `sha` is the blob SHA the edit was based on. GitHub returns 409 when the
 * file has moved on since, which is surfaced as a conflict so the caller can
 * tell the user to reload rather than clobbering someone else's change.
 */
export async function saveContent(
  config: RepoConfig,
  json: unknown,
  sha: string,
  message: string,
  authorEmail: string
): Promise<{ commitUrl: string }> {
  // Two-space JSON with a trailing newline, matching how the file is committed
  // by hand, so a portal edit produces a minimal diff rather than reformatting
  // the whole file.
  const text = `${JSON.stringify(json, null, 2)}\n`;

  const url = `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${CONTENT_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: { ...headers(config), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: Buffer.from(text, "utf8").toString("base64"),
        sha,
        branch: config.branch,
        // Attributing the commit to the signed-in admin is the audit trail;
        // without it every content change would read as the token's owner.
        committer: { name: "Kinetic staff portal", email: authorEmail },
        author: { name: authorEmail.split("@")[0], email: authorEmail },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ContentRepoError("Couldn't reach GitHub to save the change. Try again.");
  }

  if (response.status === 409 || response.status === 422) {
    throw new ContentRepoError(
      "Someone else changed the content while you were editing. Reload the page and make your change again.",
      true
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ContentRepoError(
      "GitHub rejected the access token when saving. It may lack write access to the repository."
    );
  }
  if (!response.ok) {
    throw new ContentRepoError(`GitHub responded ${response.status} while saving the change.`);
  }

  const payload = (await response.json()) as { commit?: { html_url?: string } };
  return { commitUrl: payload.commit?.html_url ?? "" };
}
