import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ContentRepoError,
  CONTENT_PATH,
  loadContent,
  repoConfig,
  saveContent,
} from "@/lib/admin/content-repo";

/**
 * The GitHub transport, exercised against a stubbed fetch.
 *
 * These cover the paths that only show up when something goes wrong — an
 * expired token, a concurrent edit, a repository whose content file has been
 * hand-broken — because those are exactly the ones nobody hits until the
 * clinic hits them.
 */

const CONFIG = {
  token: "tok",
  owner: "acme",
  repo: "site",
  branch: "main",
  apiRoot: "https://api.github.com",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A Contents API GET payload wrapping the given object. */
function contentsPayload(value: unknown, sha = "abc123"): unknown {
  return { sha, encoding: "base64", content: Buffer.from(JSON.stringify(value)).toString("base64") };
}

/** Stubs global fetch with a typed mock, so `mock.calls` destructures without
 *  a cast — an untyped `vi.fn()` infers a zero-argument call signature. */
function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const mock = vi.fn(handler);
  vi.stubGlobal("fetch", mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("repoConfig", () => {
  it("is null until both the token and the repo are set", () => {
    expect(repoConfig({})).toBeNull();
    expect(repoConfig({ CONTENT_GITHUB_TOKEN: "tok" })).toBeNull();
    expect(repoConfig({ CONTENT_GITHUB_REPO: "acme/site" })).toBeNull();
  });

  it("splits owner and repo, defaulting the branch to main", () => {
    expect(repoConfig({ CONTENT_GITHUB_TOKEN: "tok", CONTENT_GITHUB_REPO: "acme/site" })).toEqual({
      token: "tok",
      owner: "acme",
      repo: "site",
      branch: "main",
      apiRoot: "https://api.github.com",
    });
  });

  it("honours a branch override", () => {
    // A preview deployment can point at its own branch so staff can trial
    // edits without touching what production builds from.
    expect(
      repoConfig({
        CONTENT_GITHUB_TOKEN: "tok",
        CONTENT_GITHUB_REPO: "acme/site",
        CONTENT_GITHUB_BRANCH: "staging",
      })?.branch
    ).toBe("staging");
  });

  it("rejects a repo value that isn't owner/repo", () => {
    expect(repoConfig({ CONTENT_GITHUB_TOKEN: "tok", CONTENT_GITHUB_REPO: "site" })).toBeNull();
  });

  it("defaults the API root to github.com and strips a trailing slash from an override", () => {
    // The override exists for GitHub Enterprise Server; a trailing slash would
    // produce a double slash in every request path.
    const base = { CONTENT_GITHUB_TOKEN: "tok", CONTENT_GITHUB_REPO: "acme/site" };
    expect(repoConfig(base)?.apiRoot).toBe("https://api.github.com");
    expect(repoConfig({ ...base, CONTENT_GITHUB_API_URL: "https://ghe.example/api/v3/" })?.apiRoot).toBe(
      "https://ghe.example/api/v3"
    );
  });
});

describe("loadContent", () => {
  it("decodes the file and returns its blob sha", async () => {
    stubFetch(async () => jsonResponse(200, contentsPayload({ practitioners: [] }, "sha-1")));

    const result = await loadContent(CONFIG);
    expect(result.json).toEqual({ practitioners: [] });
    expect(result.sha).toBe("sha-1");
  });

  it("requests the configured branch and bypasses any cache", async () => {
    // A cached read would hand back a stale sha, and the next save would fail
    // as a phantom conflict.
    const fetchMock = stubFetch(async () => jsonResponse(200, contentsPayload({})));

    await loadContent({ ...CONFIG, branch: "staging" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.startsWith("https://api.github.com/repos/acme/site/")).toBe(true);
    expect(url).toContain(CONTENT_PATH);
    expect(url).toContain("ref=staging");
    expect(init.cache).toBe("no-store");
  });

  it.each([401, 403])("reports an unusable token on %i", async (status) => {
    stubFetch(async () => jsonResponse(status, {}));
    await expect(loadContent(CONFIG)).rejects.toThrow(/access token/i);
  });

  it("names the file and branch when the path is missing", async () => {
    stubFetch(async () => jsonResponse(404, {}));
    await expect(loadContent(CONFIG)).rejects.toThrow(/main branch of acme\/site/);
  });

  it("says the file needs fixing by hand when it isn't valid JSON", async () => {
    // The portal cannot repair this, and pretending otherwise would have it
    // commit a file built from a failed parse.
    stubFetch(async () =>
      jsonResponse(200, { sha: "s", encoding: "base64", content: Buffer.from("{oops").toString("base64") })
    );
    await expect(loadContent(CONFIG)).rejects.toThrow(/isn't valid JSON/);
  });

  it("surfaces a network failure as a readable error", async () => {
    stubFetch(async () => { throw new Error("ECONNRESET"); });
    await expect(loadContent(CONFIG)).rejects.toBeInstanceOf(ContentRepoError);
  });
});

describe("saveContent", () => {
  it("PUTs the file with the sha it was based on", async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { commit: { html_url: "https://commit" } }));

    const result = await saveContent(CONFIG, { a: 1 }, "sha-1", "Update thing", "owner@example.com");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init.body));
    expect(init.method).toBe("PUT");
    expect(body.sha).toBe("sha-1");
    expect(body.branch).toBe("main");
    expect(body.message).toBe("Update thing");
    expect(result.commitUrl).toBe("https://commit");
  });

  it("writes two-space JSON with a trailing newline", async () => {
    // Matching how the file is committed by hand keeps a portal edit to a
    // minimal diff instead of reformatting the whole file.
    const fetchMock = stubFetch(async () => jsonResponse(200, {}));

    await saveContent(CONFIG, { a: { b: 1 } }, "s", "m", "owner@example.com");

    const [, init] = fetchMock.mock.calls[0];
    const written = Buffer.from(JSON.parse(String(init.body)).content, "base64").toString("utf8");
    expect(written).toBe('{\n  "a": {\n    "b": 1\n  }\n}\n');
  });

  it("attributes the commit to the signed-in admin", async () => {
    // Without this every content change reads as the token owner, which
    // destroys the audit trail the commit history is there to provide.
    const fetchMock = stubFetch(async () => jsonResponse(200, {}));

    await saveContent(CONFIG, {}, "s", "m", "reception@clinic.ca");

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.author.email).toBe("reception@clinic.ca");
    expect(body.committer.email).toBe("reception@clinic.ca");
  });

  it.each([409, 422])("reports %i as a conflict rather than a generic failure", async (status) => {
    // Two people editing at once must produce a visible "reload and try
    // again", never a silent overwrite of someone else's change.
    stubFetch(async () => jsonResponse(status, {}));

    await expect(saveContent(CONFIG, {}, "stale", "m", "a@b.co")).rejects.toMatchObject({
      conflict: true,
    });
  });

  it("reports a token that can read but not write", async () => {
    stubFetch(async () => jsonResponse(403, {}));
    await expect(saveContent(CONFIG, {}, "s", "m", "a@b.co")).rejects.toThrow(/write access/i);
  });
});
