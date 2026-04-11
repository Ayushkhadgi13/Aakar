import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const getEcho = async () => {
  const token = await SecureStore.getItemAsync('userToken');

  return new Echo({
    broadcaster: 'reverb',
    client: new Pusher(process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'app-key', {
      wsHost: BASE_HOST,
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws'],
      cluster: 'mt1',
    }),
    authEndpoint: `http://${BASE_HOST}:8000/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};