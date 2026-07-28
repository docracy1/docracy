#!/usr/bin/env bash
set -euo pipefail

fail=0

check() {
  local name="$1" url="$2" expect="${3:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "OK  $name ($code) $url"
  else
    echo "FAIL $name (got $code, want $expect) $url"
    fail=1
  fi
}

echo "=== Docracy go-live verification ==="
check "Homepage" "https://docracy.io/"
check "Pricing" "https://docracy.io/pricing"
check "MCP page" "https://docracy.io/mcp"
check "Docs" "https://docracy.io/docs"
check "Sitemap" "https://docracy.io/sitemap.xml"
check "RSS" "https://docracy.io/blog/feed.xml"
check "IndexNow key" "https://docracy.io/docracy-indexnow-20260728.txt"
check "Worker root" "https://api.docracy.io/"
check "Connector" "https://mcp.docracy.io/mcp" "200"

if [[ $fail -eq 0 ]]; then
  echo "All checks passed — Docracy is live."
else
  echo "Some checks failed."
  exit 1
fi
