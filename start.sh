#!/usr/bin/env bash
# Task Manager Pro - one-command launcher (source distribution)
# 1) builds the React SPA once if wwwroot is empty (needs Node.js)
# 2) runs the ASP.NET Core 8 API serving the SPA on 0.0.0.0:$PORT
#
#   PORT=3000 bash start.sh          # SQLite demo mode (auto-seeds, no DB server needed)
#
# For SQL Server: edit server/TaskManagerPro.Api/appsettings.json and run without --sqlite
# (see README "Running with SQL Server").
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
API_DIR="$DIR/server/TaskManagerPro.Api"

if ! command -v dotnet >/dev/null 2>&1; then
  echo "ERROR: .NET 8 SDK not found. Install from https://dotnet.microsoft.com/download/dotnet/8.0" >&2
  exit 1
fi

# Build the SPA only if the pre-built bundle is missing
if [ ! -f "$API_DIR/wwwroot/index.html" ]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: wwwroot is empty and npm is unavailable - install Node.js 18+ or restore wwwroot." >&2
    exit 1
  fi
  echo "[start] building React client (first run)..."
  (cd "$DIR/client" && npm install && npm run build)
fi

cd "$API_DIR"
echo "[start] launching TaskManagerPro.Api on http://0.0.0.0:$PORT (SQLite demo mode)"
exec dotnet run -c Release --urls "http://0.0.0.0:$PORT" -- --sqlite "$@"
