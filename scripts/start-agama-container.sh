#!/bin/sh
set -eu

cd /app/configurator
node server.js &

nginx -g 'daemon off;'
