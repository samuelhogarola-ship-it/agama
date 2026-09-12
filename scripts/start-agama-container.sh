#!/bin/sh
set -eu

CONFIGURATOR_DIR="/app/apps/configurador/.next/standalone"

if [ -f "$CONFIGURATOR_DIR/server.js" ]; then
  (
    cd "$CONFIGURATOR_DIR"
    HOSTNAME=127.0.0.1 PORT="${CONFIGURATOR_PORT:-3000}" node server.js
  ) &
else
  echo "Configurator standalone server not found; serving static site only." >&2
fi

exec nginx -g 'daemon off;'
