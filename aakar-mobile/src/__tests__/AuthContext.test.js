import React, { useContext } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import MockAdapter from 'axios-mock-adapter';
import api from '../api/axios';
import { AuthProvider, AuthContext } from '../context/AuthContext';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('fake-jwt-token')),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

let mockNotificationCallback = null;
jest.mock('../api/echo', () => ({
  getEcho: jest.fn().mockResolvedValue({
    private: jest.fn().mockReturnThis(),
    notification: jest.fn((callback) => { mockNotificationCallback = callback; }),
    leave: jest.fn(),
  }),
}));

const mockAxios = new MockAdapter(api);

const DummyConsumer = () => {
  const { user, unreadCount, taskUpdateTrigger } = useContext(AuthContext);
  return (
    <View>
      <Text testID="user-name">{user ? user.name : 'No User'}</Text>
      <Text testID="unread-count">{unreadCount}</Text>
      <Text testID="update-trigger">{taskUpdateTrigger}</Text>
    </View>
  );
};

describe('AuthContext - MT-03 & MT-04', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockNotificationCallback = null;
    jest.clearAllMocks();
  });

  it('MT-04: Verifies user receives task-related notifications (Unread count increments)', async () => {
    mockAxios.onGet('/user').reply(200, { id: 1, name: 'Admin', role: 'admin' });
    mockAxios.onGet('/notifications').reply(200, [{ id: '1', data: { title: 'Old Notification' } }]);

    const { getByTestId } = render(<AuthProvider><DummyConsumer /></AuthProvider>);

    await waitFor(() => expect(getByTestId('unread-count').props.children).toBe(1));
    
    mockNotificationCallback({ id: '2', type: 'App\\Notifications\\TaskAssigned', title: 'New Task' });
    
    await waitFor(() => expect(getByTestId('unread-count').props.children).toBe(2));
  });

  it('MT-03: Verifies task updates reflect instantly across the system (trigger increments)', async () => {
    mockAxios.onGet('/user').reply(200, { id: 1, name: 'Admin', role: 'admin' });
    mockAxios.onGet('/notifications').reply(200, []);

    const { getByTestId } = render(<AuthProvider><DummyConsumer /></AuthProvider>);
    await waitFor(() => expect(getByTestId('update-trigger').props.children).toBe(0));

    mockNotificationCallback({ id: '3', type: 'App\\Notifications\\TaskCompleted', title: 'Task Done' });

    await waitFor(() => expect(getByTestId('update-trigger').props.children).toBe(1));
  });
});