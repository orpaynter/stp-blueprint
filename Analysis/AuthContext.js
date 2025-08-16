import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load token from storage on app start
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        // Verify token is not expired
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          setUserToken(token);
          setUser(decodedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token expired, remove it
          await AsyncStorage.removeItem('userToken');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
    } catch (e) {
      console.error('Failed to load auth token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store token
      await AsyncStorage.setItem('userToken', token);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUserToken(token);
      setUser(user);
      
      return { success: true };
    } catch (e) {
      console.error('Login error', e);
      setError(e.response?.data?.error || 'Failed to login');
      return { 
        success: false, 
        error: e.response?.data?.error || 'Failed to login' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      return { success: true, data: response.data };
    } catch (e) {
      console.error('Registration error', e);
      setError(e.response?.data?.error || 'Failed to register');
      return { 
        success: false, 
        error: e.response?.data?.error || 'Failed to register' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Remove token from storage
      await AsyncStorage.removeItem('userToken');
      
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];
      
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    if (!userToken) return false;
    
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      const { token } = response.data;
      
      // Store new token
      await AsyncStorage.setItem('userToken', token);
      
      // Update auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUserToken(token);
      
      return true;
    } catch (e) {
      console.error('Token refresh error', e);
      
      // If refresh fails, log out
      await logout();
      
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        user,
        error,
        login,
        register,
        logout,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
