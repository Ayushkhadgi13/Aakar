import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

window.Pusher = Pusher;

const BASE_URL = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const getEcho = async () => {
  const token = await SecureStore.getItemAsync('userToken');
  
  return new Echo({
    broadcaster: 'reverb',
    key: 'app-key', // Ensure this matches your .env VITE_REVERB_APP_KEY
    wsHost: BASE_URL,
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false, // Set to true if using https in production
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `http://${BASE_URL}:8000/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};