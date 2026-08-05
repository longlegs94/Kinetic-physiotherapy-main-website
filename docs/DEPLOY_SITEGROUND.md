# Deploying to SiteGround

This site can be built two ways from the same codebase. On SiteGround you almost
certainly want the **static build**.

| | Static build (recommended) | Node build |
|---|---|---|
| Command | `npm run build:static` | `npm run build` |
| Output | a folder of files in `out/` | a Next server you must keep running |
| SiteGround support | every plan | only plans with the **Node.js App** tool |
| Contact / intake / feedback / ICBC forms | ✅ (posts straight to Web3Forms) | ✅ (via the server relay) |
| AI booking concierge | ❌ shows call/book options instead | ✅ |
| AI intake summary | ❌ sends the raw answers instead | ✅ |
| Symptom router box | hidden (the manual selector replaces it) | ✅ |
| Redirects + security headers | ✅ via generated `.htaccess` | ✅ via `next.config.mjs` |
| Speed / reliability | fastest, nothing to crash | depends on the Node process staying up |

Nothing about the marketing site, SEO, schema, sitemap, blog, or booking links
changes between the two. The only losses are the three AI-backed extras — and
you can get those back on a static build too, see
[Keeping the AI features](#keeping-the-ai-features-optional).

---

## 1. One-time setup

### a. Point the build at your real domain

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SITE_URL=https://www.kinetictherapyclinic.ca
NEXT_PUBLIC_WEB3FORMS_KEY=your-web3forms-access-key
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

- **`NEXT_PUBLIC_SITE_URL`** drives canonical URLs, the sitemap, JSON-LD schema,
  and the canonical-host redirect in `.htaccess`. Use the exact hostname you'll
  serve on, including `www.` if that's your canonical form. No trailing slash.
- **`NEXT_PUBLIC_WEB3FORMS_KEY`** is what makes the forms deliver. Get a free key
  at <https://web3forms.com>. On a static site the browser posts to Web3Forms
  itself, so the key has to be readable by the browser — that's how Web3Forms is
  designed to work for static sites. It's a submission-only token; it can't read
  past submissions. Without it, forms fall back to opening the visitor's email app.
- **`NEXT_PUBLIC_GA_ID`** is optional; leave it out and analytics stays off.

### b. Enable SSL on SiteGround

Site Tools → **Security → SSL Manager** → issue the free Let's Encrypt cert for
your domain, then turn on **HTTPS Enforce**.

Do this *before* you go live. The generated `.htaccess` sends an HSTS header
telling browsers to only ever use HTTPS for this domain — which is what you want,
but it's sticky, so the certificate needs to be working first.

### c. Get your SSH details (for automated deploys)

Site Tools → **Devs → SSH Keys Manager** → generate or import a key, then
**Manage** to see the host, username, and port (usually `18765`).

If your plan has no SSH, skip to [Manual upload](#manual-upload).

---

## 2. Build

```bash
npm install
npm run build:static
```

This produces `out/` — everything that belongs in `public_html`, including a
generated `.htaccess`. Preview it locally before uploading:

```bash
npm run preview:static     # http://localhost:3000
```

> The local preview serves plain files, so it won't apply the `.htaccess` rules.
> URLs and links will look right; the redirects only take effect on Apache.

---

## 3. Deploy

### Automated: from your machine

Create `.env.deploy` (git-ignored) once:

```bash
SITEGROUND_SSH_HOST=giowl1234.siteground.biz
SITEGROUND_SSH_USER=u1234-abcdefgh
SITEGROUND_SSH_PORT=18765
SITEGROUND_SSH_KEY=~/.ssh/id_siteground
SITEGROUND_REMOTE_PATH=/home/u1234-abcdefgh/www/kinetictherapyclinic.ca/public_html
```

Then, whenever you want to publish:

```bash
npm run deploy:siteground -- --dry-run   # see exactly what would change
npm run deploy:siteground                # build + upload
```

It builds, refuses to upload if `out/index.html` or `out/.htaccess` is missing,
and rsyncs only changed files. `.well-known/`, `cgi-bin/`, `.htpasswd`, and
`sg-cachepress/` are never deleted — SiteGround and Let's Encrypt own those.

No SSH on your plan? The same command falls back to FTPS if you set
`SITEGROUND_FTP_HOST`, `SITEGROUND_FTP_USER`, and `SITEGROUND_FTP_PASSWORD`
instead (needs `lftp` installed locally).

### Automated: from GitHub

`.github/workflows/deploy-siteground.yml` does the same thing in CI. Add these
under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SITEGROUND_SSH_HOST` | e.g. `giowl1234.siteground.biz` |
| `SITEGROUND_SSH_USER` | e.g. `u1234-abcdefgh` |
| `SITEGROUND_SSH_PORT` | usually `18765` |
| `SITEGROUND_SSH_KEY` | the **private** key (whole file, including the BEGIN/END lines) |
| `SITEGROUND_REMOTE_PATH` | e.g. `/home/u1234-abcdefgh/www/example.com/public_html` |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://www.kinetictherapyclinic.ca` |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | optional but needed for form delivery |
| `NEXT_PUBLIC_GA_ID` | optional |

Then deploy either by pushing to `main`, or from the **Actions** tab →
*Deploy to SiteGround* → **Run workflow** when you're ready. If you only ever
want the manual button, delete the `push:` block at the top of the workflow.

### Manual upload

Site Tools → **Site → File Manager** → open `public_html`, and upload the
**contents** of `out/` (not the `out` folder itself).

Two things people get wrong here:

1. **`.htaccess` is a hidden file.** Turn on hidden files in File Manager, or the
   upload will silently skip it — and you'd lose every old-WordPress redirect and
   every security header. Verify it landed before you call it done.
2. **Delete the old WordPress files first**, or leftovers (`wp-admin/`,
   `wp-content/`, the old `index.php`, the old `.htaccess`) will fight the new
   site for the same URLs.

---

## 4. After the first deploy

Flush SiteGround's cache: Site Tools → **Speed → Caching → Dynamic Cache** →
Flush. Then check:

```bash
curl -I https://www.kinetictherapyclinic.ca/
curl -I https://www.kinetictherapyclinic.ca/therapists      # → 301 to /team
curl -I https://www.kinetictherapyclinic.ca/blog            # → 200
```

- [ ] Home, services, team, contact, blog, and a service page all load
- [ ] Old WordPress URLs 301 correctly (`/therapists`, `/gallery/`, `/shop`)
- [ ] Submit the contact form and confirm it arrives in the clinic inbox
- [ ] `https://<domain>/sitemap.xml` loads, then submit it in Google Search Console
- [ ] `https://<domain>/robots.txt` shows your real domain
- [ ] Share a link in Slack/iMessage and confirm the preview image renders
- [ ] Book Now still opens Jane

Then watch Search Console → **Pages** for a few weeks. If an old URL 404s, add it
to `wordpressRedirects` in `config/site-rules.mjs` and redeploy.

---

## 5. Iterating

The normal loop:

```bash
npm run dev                  # edit content/site-content.json, components, etc.
git commit -am "Update service copy"
npm run deploy:siteground    # or push to main / hit Run workflow
```

Most content lives in `content/site-content.json` — see the main README.

**Editing redirects or security headers?** They live in `config/site-rules.mjs`,
which feeds both `next.config.mjs` and the `.htaccess` generator. Change them
there and both targets stay in sync. Never hand-edit `out/.htaccess`; it's
regenerated on every build.

---

## Keeping the AI features (optional)

The concierge, symptom router, and AI intake summary need a server. To keep them
on a static SiteGround site, host just the API routes elsewhere and point the
site at them:

1. Deploy this same repo to a free Vercel project (it builds as a Node app there
   and the `app/api/**` routes come alive).
2. Set `NEXT_PUBLIC_API_BASE_URL=https://your-api-project.vercel.app` and rebuild
   the static site.

The build adds that origin to the CSP automatically. You'll also need the API
side to accept requests from your SiteGround domain — see `isAllowedOrigin` in
`lib/rate-limit.ts`.

If your plan *does* have the Node.js App tool and you'd rather run the whole
thing on SiteGround, use `npm run build`/`npm start` instead and skip the static
export entirely. Be aware the Node process needs monitoring in a way the static
files don't.

---

## Troubleshooting

**Every page 404s except the home page.** `.htaccess` didn't upload, or Apache is
ignoring it. Confirm the file exists in `public_html` and that the host allows
overrides.

**Redirect loop.** Usually HTTPS Enforce in Site Tools fighting the HTTPS rule in
`.htaccess`. Turn off HTTPS Enforce — the `.htaccess` already handles it, and it
accounts for SiteGround's SSL termination via `X-Forwarded-Proto`.

**Old site still showing.** SiteGround caching. Flush Dynamic Cache, then
hard-reload. Remember HTML is served `must-revalidate`, so this clears quickly
once the cache is flushed.

**Forms open an email app instead of sending.** `NEXT_PUBLIC_WEB3FORMS_KEY` was
missing at *build* time. It's baked into the bundle, so set it and rebuild — you
can't add it after the fact on the server.

**Styles missing / everything unstyled.** `_next/` didn't upload. It's the
biggest folder; File Manager uploads sometimes time out on it. Use the rsync
deploy instead.

**Social previews show no image.** The OG image is an extensionless file, so
Apache needs the `ForceType image/png` rule from `.htaccess` — another sign the
file didn't upload.
