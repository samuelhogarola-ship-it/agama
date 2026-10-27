#!/bin/sh
set -eu

CONFIGURATOR_DIR="/app/apps/configurador/.next/standalone"

AGAMA_CONTENT_DIR="${AGAMA_CONTENT_DIR:-/data/agama-blogger}" \
AGAMA_PUBLIC_DIR="/usr/share/nginx/html" \
AGAMA_BLOG_SNAPSHOT="/app/blogger/content/blogger/history.json" \
BLOGGER_PORT="${BLOGGER_PORT:-3010}" \
node /app/blogger/scripts/agama-blogger-server.mjs &

if [ -f "$CONFIGURATOR_DIR/server.js" ]; then
  (
    cd "$CONFIGURATOR_DIR"
    HOSTNAME=127.0.0.1 PORT="${CONFIGURATOR_PORT:-3000}" node server.js
  ) &
else
  echo "Configurator standalone server not found; serving static site only." >&2
fi

exec nginx -g 'daemon off;'
