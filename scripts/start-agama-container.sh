#!/bin/sh
set -eu

cd /app/apps/configurador/.next/standalone
HOSTNAME=127.0.0.1 PORT="${CONFIGURATOR_PORT:-3000}" node server.js &

nginx -g 'daemon off;'
