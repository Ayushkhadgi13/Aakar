import { jest } from '@jest/globals';

// Globally mock Expo Secure Store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('fake-token')),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Globally mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:8000' },
  manifest: {},
  manifest2: {},
}));

// Mock React Native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn((obj) => obj.android),
}));