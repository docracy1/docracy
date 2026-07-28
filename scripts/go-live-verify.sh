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
check "Worker root" "https://api.docracy.io/" "404"
check "Status API (worker)" "https://api.docracy.io/api/status" "200"
check "Status API (same-origin proxy)" "https://docracy.io/api/status" "200"
check "Connector auth gate" "https://mcp.docracy.io/mcp" "401"

status_ct=$(curl -sS -o /dev/null -w "%{content_type}" --max-time 15 "https://docracy.io/api/status" || echo "")
if [[ "$status_ct" == *"application/json"* ]]; then
  echo "OK  Status API content-type ($status_ct)"
else
  echo "FAIL Status API content-type (got $status_ct, want application/json) https://docracy.io/api/status"
  fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "All checks passed — Docracy is live."
else
  echo "Some checks failed."
  exit 1
fi
