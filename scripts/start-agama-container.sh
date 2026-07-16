#!/bin/sh
set -eu

cd /app/apps/configurador/.next/standalone
node server.js &

nginx -g 'daemon off;'
