import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './style.css'

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const APP_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const REVERB_AUTH_ENDPOINT = import.meta.env.VITE_REVERB_AUTH_ENDPOINT || `${API_BASE_URL}/broadcasting/auth`;

const initWebsockets = () => {
  const token = localStorage.getItem('token');
  if (token && !window.Echo) {
    window.Echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY || 'app-key',
      wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: REVERB_AUTH_ENDPOINT,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
};

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['X-App-Base-Url'] = APP_BASE_URL;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

initWebsockets();

const app = createApp(App)
app.use(router)
app.mount('#app')
