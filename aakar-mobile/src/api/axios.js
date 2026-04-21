import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Let local development override the inferred Expo host when needed.
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const FALLBACK_LAN_BASE_URL = 'http://192.168.31.16:8000/api';
const IOS_SIMULATOR_BASE_URL = 'http://localhost:8000/api';

const inferExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0];
  return host ? `http://${host}:8000/api` : null;
};

const getDefaultBaseUrl = () => {
  const expoHostBaseUrl = inferExpoHost();
  if (expoHostBaseUrl) {
    return expoHostBaseUrl;
  }

  // iOS simulators can still reach a backend on the host machine via localhost.
  if (Platform.OS === 'ios') {
    return IOS_SIMULATOR_BASE_URL;
  }

  return FALLBACK_LAN_BASE_URL;
};

const BASE_URL = ENV_BASE_URL || getDefaultBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };
export default api;
