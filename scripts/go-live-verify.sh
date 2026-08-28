#!/usr/bin/env bash
set -euo pipefail

APP_URL="${PUBLIC_APP_URL:-https://docracy.io}"
API_URL="${PUBLIC_WORKER_URL:-https://api.docracy.io}"
MCP_URL="${PUBLIC_CONNECTOR_URL:-https://mcp.docracy.io}"
INDEXNOW_KEY="${INDEXNOW_KEY:-docracy-indexnow-20260728}"

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
echo "APP_URL=$APP_URL API_URL=$API_URL MCP_URL=$MCP_URL"
check "Homepage" "$APP_URL/"
check "Pricing" "$APP_URL/pricing"
check "MCP page" "$APP_URL/mcp"
check "Docs" "$APP_URL/docs"
check "Sitemap" "$APP_URL/sitemap.xml"
check "RSS" "$APP_URL/blog/feed.xml"
check "IndexNow key" "$APP_URL/$INDEXNOW_KEY.txt"
check "Worker root" "$API_URL/" "404"
check "Status API (worker)" "$API_URL/api/status" "200"
check "Status API (same-origin proxy)" "$APP_URL/api/status" "200"

mcp_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$MCP_URL/mcp" || echo "000")
if [[ "$mcp_code" == "401" || "$mcp_code" == "405" || "$mcp_code" == "406" ]]; then
  echo "OK  Connector auth gate ($mcp_code) $MCP_URL/mcp"
else
  echo "FAIL Connector auth gate (got $mcp_code, want 401/405/406) $MCP_URL/mcp"
  fail=1
fi

status_ct=$(curl -sS -o /dev/null -w "%{content_type}" --max-time 15 "$APP_URL/api/status" || echo "")
if [[ "$status_ct" == *"application/json"* ]]; then
  echo "OK  Status API content-type ($status_ct)"
else
  echo "FAIL Status API content-type (got $status_ct, want application/json) $APP_URL/api/status"
  fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "All checks passed — Docracy is live."
else
  echo "Some checks failed."
  exit 1
fi
