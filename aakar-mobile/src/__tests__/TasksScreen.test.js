import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MockAdapter from 'axios-mock-adapter';
import api from '../api/axios';
import TasksScreen from '../screens/TasksScreen';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock React Native Alert
jest.spyOn(Alert, 'alert');

const mockAxios = new MockAdapter(api);

const mockUser = { id: 1, name: 'John Doe', role: 'user' };

const renderWithContext = (component) => {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <AuthContext.Provider value={{ user: mockUser, taskUpdateTrigger: 0 }}>
        {component}
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
};

describe('TasksScreen', () => {
  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('MT-01: Verifies assigned tasks are displayed correctly', async () => {
    mockAxios.onGet('/tasks').reply(200, {
      my_tasks: [
        { id: 101, title: 'Build Foundation', status: 'Pending', description: 'Start digging' },
      ],
      assigned_by_me: []
    });

    const { getByText } = renderWithContext(<TasksScreen />);

    // Wait for the API call to resolve and UI to update
    await waitFor(() => {
      expect(getByText('Build Foundation')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
      expect(getByText('Start digging')).toBeTruthy();
    });
  });

  it('MT-02: Verifies user can update task status successfully', async () => {
    mockAxios.onGet('/tasks').reply(200, {
      my_tasks: [{ id: 101, title: 'Build Foundation', status: 'Pending' }],
      assigned_by_me: []
    });
    mockAxios.onPut('/tasks/101').reply(200, { message: 'Success' });

    const { getByText, getByDisplayValue } = renderWithContext(<TasksScreen />);

    await waitFor(() => expect(getByText('Build Foundation')).toBeTruthy());

    // Find the update status button (React Native picker mock/workaround)
    const inProgressButton = getByText('In Progress');
    fireEvent.press(inProgressButton);

    // Assert the PUT request was made
    await waitFor(() => {
      expect(mockAxios.history.put.length).toBe(1);
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual({ status: 'In Progress' });
    });
  });

  it('MT-05: Verifies app handles network errors without crashing', async () => {
    // Simulate a network error
    mockAxios.onGet('/tasks').networkError();

    renderWithContext(<TasksScreen />);

    // Wait for the catch block to trigger the alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Network Error',
        'Cannot reach the backend. Please check your connection.'
      );
    });
  });
});