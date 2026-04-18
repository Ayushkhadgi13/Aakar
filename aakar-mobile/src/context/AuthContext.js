import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    try {
      const res = await api.get('/user');
      setUser(res.data);
    } catch (e) {
      console.log("Failed to load user", e);
      logout();
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/login', {
        email: email.trim(),
        password,
      });
      const token = response.data.access_token;
      setUser(response.data.user);
      setUserToken(token);
      await SecureStore.setItemAsync('userToken', token);
    } catch (e) {
      console.log('Login error', e.response?.data || e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/logout');
    } catch (e) {
      console.log(e);
    }
    setUserToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('userToken');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await SecureStore.getItemAsync('userToken');
      if (token) {
        setUserToken(token);
        await loadUser();
      }
    } catch (e) {
      console.log('isLoggedIn in error', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, user }}>
      {children}
    </AuthContext.Provider>
  );
};
