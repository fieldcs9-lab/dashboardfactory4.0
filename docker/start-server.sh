#!/bin/sh
set -eu

PORT="${PORT:-10000}"

exec php -S 0.0.0.0:"${PORT}" -t /var/www/html
