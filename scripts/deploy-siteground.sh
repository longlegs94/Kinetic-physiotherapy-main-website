#!/usr/bin/env bash
#
# Uploads the static build in out/ to SiteGround.
#
#   npm run deploy:siteground              # build, then upload
#   npm run deploy:siteground -- --dry-run # show what would change, upload nothing
#   npm run deploy:siteground -- --no-build# upload the existing out/ as-is
#
# Prefers rsync over SSH (fast, incremental, available on SiteGround GrowBig
# and above). Falls back to lftp over FTPS when SSH credentials aren't set.
#
# Credentials come from the environment or .env.deploy (git-ignored):
#
#   SITEGROUND_SSH_HOST      e.g. giowl1234.siteground.biz
#   SITEGROUND_SSH_USER      e.g. u1234-abcdefgh
#   SITEGROUND_SSH_PORT      usually 18765
#   SITEGROUND_REMOTE_PATH   e.g. ~/www/kinetictherapyclinic.ca/public_html
#   SITEGROUND_SSH_KEY       path to the private key (default ~/.ssh/id_rsa)
#
#   # FTPS fallback
#   SITEGROUND_FTP_HOST / SITEGROUND_FTP_USER / SITEGROUND_FTP_PASSWORD
#
set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=0
BUILD=1
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --no-build) BUILD=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

# Local, git-ignored credentials file.
if [[ -f .env.deploy ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.deploy
  set +a
fi

if [[ "$BUILD" -eq 1 ]]; then
  echo "==> Building static export"
  npm run build:static
fi

if [[ ! -f out/index.html ]]; then
  echo "ERROR: out/index.html is missing — the build did not produce a site." >&2
  exit 1
fi
if [[ ! -f out/.htaccess ]]; then
  echo "ERROR: out/.htaccess is missing — redirects and security headers would be lost." >&2
  exit 1
fi

REMOTE_PATH="${SITEGROUND_REMOTE_PATH:-}"
if [[ -z "$REMOTE_PATH" ]]; then
  echo "ERROR: SITEGROUND_REMOTE_PATH is not set (e.g. ~/www/example.com/public_html)." >&2
  exit 1
fi

# Never delete these on the remote, even in --delete mode: SiteGround and
# Let's Encrypt keep their own files inside public_html.
PROTECTED=(
  "--exclude=.well-known/"
  "--exclude=cgi-bin/"
  "--exclude=.htpasswd"
  "--exclude=sg-cachepress/"
)

if [[ -n "${SITEGROUND_SSH_HOST:-}" && -n "${SITEGROUND_SSH_USER:-}" ]]; then
  PORT="${SITEGROUND_SSH_PORT:-18765}"
  KEY="${SITEGROUND_SSH_KEY:-$HOME/.ssh/id_rsa}"

  RSYNC_ARGS=(
    -az
    --delete
    --checksum
    --human-readable
    --itemize-changes
    "${PROTECTED[@]}"
    -e "ssh -p ${PORT} -i ${KEY} -o StrictHostKeyChecking=accept-new"
  )
  [[ "$DRY_RUN" -eq 1 ]] && RSYNC_ARGS+=(--dry-run)

  echo "==> rsync → ${SITEGROUND_SSH_USER}@${SITEGROUND_SSH_HOST}:${REMOTE_PATH}"
  # Trailing slash on out/ uploads the contents, not the folder itself.
  rsync "${RSYNC_ARGS[@]}" out/ \
    "${SITEGROUND_SSH_USER}@${SITEGROUND_SSH_HOST}:${REMOTE_PATH}/"

elif [[ -n "${SITEGROUND_FTP_HOST:-}" && -n "${SITEGROUND_FTP_USER:-}" ]]; then
  if ! command -v lftp >/dev/null 2>&1; then
    echo "ERROR: lftp is required for the FTPS fallback (brew/apt install lftp)." >&2
    exit 1
  fi

  MIRROR_ARGS="--reverse --delete --verbose --parallel=4"
  MIRROR_ARGS+=" --exclude .well-known/ --exclude cgi-bin/ --exclude sg-cachepress/"
  [[ "$DRY_RUN" -eq 1 ]] && MIRROR_ARGS+=" --dry-run"

  echo "==> lftp (FTPS) → ${SITEGROUND_FTP_HOST}:${REMOTE_PATH}"
  lftp -c "
    set ftp:ssl-force true;
    set ftp:ssl-protect-data true;
    set ssl:verify-certificate true;
    open -u '${SITEGROUND_FTP_USER}','${SITEGROUND_FTP_PASSWORD:-}' '${SITEGROUND_FTP_HOST}';
    mirror ${MIRROR_ARGS} out/ '${REMOTE_PATH}';
    bye
  "
else
  echo "ERROR: no credentials found." >&2
  echo "  Set SITEGROUND_SSH_HOST + SITEGROUND_SSH_USER (preferred)," >&2
  echo "  or SITEGROUND_FTP_HOST + SITEGROUND_FTP_USER + SITEGROUND_FTP_PASSWORD." >&2
  echo "  See docs/DEPLOY_SITEGROUND.md." >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "==> Dry run complete — nothing was uploaded."
else
  echo "==> Deployed. If SiteGround caching is on, flush it in Site Tools → Speed → Caching."
fi
