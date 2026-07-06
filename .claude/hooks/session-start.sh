#!/bin/bash
set -euo pipefail

# Only needed in Claude Code on the web (fresh containers each session).
# Local setups keep their node_modules; skip there.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install JS dependencies. npm install (not ci) benefits from the cached
# container state and is idempotent.
npm install --no-audit --no-fund
