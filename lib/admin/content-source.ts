import bundled from "@/content/site-content.json";

import { ContentRepoError, loadContent, repoConfig } from "./content-repo";

/**
 * Where the portal's screens get the content they display.
 *
 * When a repository token is configured this is the live file on GitHub,
 * which is what the edit forms must be based on — the copy bundled into this
 * deployment is only accurate as of the last build, so an edit saved two
 * minutes ago would not be reflected and the next save would revert it.
 *
 * Without a token the portal falls back to the bundled copy and becomes a
 * read-only viewer. That is deliberately still useful: staff can check what
 * the site says about a therapist even on a deployment that cannot save.
 */
export type ContentSource =
  | { mode: "live"; json: unknown; sha: string }
  | { mode: "bundled"; json: unknown }
  | { mode: "error"; message: string };

export async function readContent(): Promise<ContentSource> {
  const config = repoConfig();
  if (!config) return { mode: "bundled", json: bundled };

  try {
    const { json, sha } = await loadContent(config);
    return { mode: "live", json, sha };
  } catch (error) {
    return {
      mode: "error",
      message:
        error instanceof ContentRepoError
          ? error.message
          : "Couldn't load the content file from GitHub.",
    };
  }
}

/** The content to render, whatever the mode — so a screen can show the current
 *  values even while reporting that saving is unavailable. */
export function contentOf(source: ContentSource): unknown {
  return source.mode === "error" ? bundled : source.json;
}
