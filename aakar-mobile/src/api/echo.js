import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ENV_REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST?.trim();
const ENV_REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT || 8080);
const ENV_REVERB_SCHEME = (process.env.EXPO_PUBLIC_REVERB_SCHEME || 'http').trim();
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const BASE_HOST = ENV_REVERB_HOST || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const AUTH_ENDPOINT = ENV_API_URL
  ? `${ENV_API_URL.replace(/\/+$/, '')}/broadcasting/auth`
  : `http://${BASE_HOST}:8000/api/broadcasting/auth`;

export const getEcho = async () => {
  const token = await SecureStore.getItemAsync('userToken');

  return new Echo({
    broadcaster: 'reverb',
    client: new Pusher(process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'app-key', {
      wsHost: BASE_HOST,
      wsPort: ENV_REVERB_PORT,
      wssPort: ENV_REVERB_PORT,
      forceTLS: ENV_REVERB_SCHEME === 'https',
      disableStats: true,
      enabledTransports: ENV_REVERB_SCHEME === 'https' ? ['wss'] : ['ws'],
      cluster: 'mt1',
    }),
    authEndpoint: AUTH_ENDPOINT,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};
