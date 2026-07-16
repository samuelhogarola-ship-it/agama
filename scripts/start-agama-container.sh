#!/bin/sh
set -eu

cd /app/apps/configurador/.next/standalone
node server.js &
NEXT_PID="$!"

for _ in $(seq 1 30); do
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then
    echo "Configurator Next server exited before nginx started" >&2
    wait "$NEXT_PID"
  fi

  if wget -qO- "http://127.0.0.1:${PORT:-3000}/configurador" >/dev/null 2>&1; then
    break
  fi

  sleep 1
done

if ! kill -0 "$NEXT_PID" 2>/dev/null; then
  echo "Configurator Next server is not running" >&2
  wait "$NEXT_PID"
fi

nginx -g 'daemon off;'
