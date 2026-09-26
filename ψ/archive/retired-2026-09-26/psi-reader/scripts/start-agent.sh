#!/usr/bin/env bash
# Helper to run the agent in the foreground (for testing / quick start).
# Usage: ./scripts/start-agent.sh <bind-ip> <token> <roots-comma-sep>
#   ./scripts/start-agent.sh 100.121.113.38 devtoken '~/notes,~/Code'
set -euo pipefail
cd "$(dirname "$0")/.."

BIND="${1:-100.121.113.38}"
TOKEN="${2:-devtoken}"
ROOTS="${3:-$HOME/Code}"

echo "→ agent on $BIND:7801  roots=$ROOTS"
ROOTS="$ROOTS" TOKEN="$TOKEN" BIND="$BIND" PORT=7801 \
  npm run start --workspace agent