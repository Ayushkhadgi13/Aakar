#!/bin/sh
set -e

cd /app

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

touch database/database.sqlite

php artisan migrate --force
php artisan db:seed --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
