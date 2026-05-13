# Aakar Deployment Guide

This repository contains three deployable parts:

- `backend`: Laravel 12 API and realtime server integration
- `frontend`: Vue 3 + Vite SPA for the web dashboard
- `aakar-mobile`: Expo / React Native mobile app

## 1. Recommended production layout

Use separate URLs for each service:

- API: `https://api.yourdomain.com`
- Web app: `https://app.yourdomain.com`
- Reverb websocket endpoint: `wss://ws.yourdomain.com`

The mobile app should point to the same production API and websocket hosts.

## 2. Backend deployment

Requirements:

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL or PostgreSQL
- A process manager for queues and Reverb
- Nginx or Apache

Deploy steps inside `backend`:

```powershell
composer install --no-dev --optimize-autoloader
copy .env.example .env
php artisan key:generate
php artisan migrate --force
npm install
npm run build
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Important `.env` values for production:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aakar
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

FILESYSTEM_DISK=public
QUEUE_CONNECTION=database

BROADCAST_CONNECTION=reverb
CACHE_STORE=database
SESSION_DRIVER=database

SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com,api.yourdomain.com

REVERB_APP_ID=aakar-app
REVERB_APP_KEY=your-reverb-key
REVERB_APP_SECRET=your-reverb-secret
REVERB_HOST=ws.yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

Long-running backend processes:

- Queue worker: `php artisan queue:work --tries=1`
- Reverb server: `php artisan reverb:start`

Run both under Supervisor, PM2, NSSM, or your host's service manager.

## 3. Web frontend deployment

Create `frontend/.env` from `frontend/.env.example`:

```dotenv
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_REVERB_APP_KEY=your-reverb-key
VITE_REVERB_HOST=ws.yourdomain.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_AUTH_ENDPOINT=https://api.yourdomain.com/api/broadcasting/auth
```

Build and publish:

```powershell
cd frontend
npm install
npm run build
```

Deploy the generated `frontend/dist` folder to your static host or web server.

If you use Nginx for the SPA, make sure unknown routes fall back to `index.html`.

## 4. Mobile app deployment

Create `aakar-mobile/.env` from `aakar-mobile/.env.example`:

```dotenv
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_REVERB_APP_KEY=your-reverb-key
EXPO_PUBLIC_REVERB_HOST=ws.yourdomain.com
EXPO_PUBLIC_REVERB_PORT=443
EXPO_PUBLIC_REVERB_SCHEME=https
```

Local testing:

```powershell
cd aakar-mobile
npm install
npx expo start
```

Production builds with EAS:

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

For Android and iOS production, avoid plain HTTP endpoints. Use HTTPS and WSS.

## 5. Known deployment-sensitive areas

- The web app now reads API and websocket settings from environment variables.
- Project document/image URLs in the web app now derive from `VITE_API_BASE_URL`.
- The mobile websocket client now reads host, port, scheme, and API URL from Expo public environment variables.
- The backend still needs valid CORS, database, queue, and Reverb configuration in production.

## 6. Suggested go-live order

1. Deploy the Laravel backend and confirm `https://api.yourdomain.com/api/login` responds.
2. Start queue worker and Reverb, then test websocket auth.
3. Deploy the Vite frontend and test login, project details, uploads, and live updates.
4. Build the Expo app with the production environment values.
