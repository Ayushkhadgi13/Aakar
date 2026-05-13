#!/bin/sh
set -e

cd /app

if [ ! -f .env ]; then
  cp .env.example .env
fi

set_env() {
  key="$1"
  value="$2"

  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

if [ -n "$APP_ENV" ]; then
  set_env APP_ENV "$APP_ENV"
fi

if [ -n "$APP_DEBUG" ]; then
  set_env APP_DEBUG "$APP_DEBUG"
fi

if [ -n "$APP_URL" ]; then
  set_env APP_URL "$APP_URL"
fi

if [ -n "$DB_CONNECTION" ]; then
  set_env DB_CONNECTION "$DB_CONNECTION"
fi

if [ -n "$DB_HOST" ]; then
  set_env DB_HOST "$DB_HOST"
fi

if [ -n "$DB_PORT" ]; then
  set_env DB_PORT "$DB_PORT"
fi

if [ -n "$DB_DATABASE" ]; then
  set_env DB_DATABASE "$DB_DATABASE"
fi

if [ -n "$DB_USERNAME" ]; then
  set_env DB_USERNAME "$DB_USERNAME"
fi

if [ -n "$DB_PASSWORD" ]; then
  set_env DB_PASSWORD "$DB_PASSWORD"
fi

if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

php artisan config:clear
php artisan cache:clear

php artisan migrate --force
php artisan db:seed --force
php artisan reports:generate-monthly || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
