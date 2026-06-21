import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { useAuth } from '../hooks/useAuth';

// This is the base query that will be used by RTK Query
export const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: async (headers) => {
    try {
      // We need to get the token from Clerk
      // This is a bit tricky in RTK Query, we'll handle it in the interceptor
      return headers;
    } catch (error) {
      console.error('Error preparing headers:', error);
      return headers;
    }
  },
});

// For axios interceptor approach (alternative)
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // We'll get the token from Clerk via a hook
      // This needs to be handled differently in RTK Query
      const token = localStorage.getItem('clerk-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    if (error.response?.status === 500) {
      // Show toast or error message
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// RTK Query wrapper that uses Clerk for auth
export const getAuthHeaders = async () => {
  try {
    // This will be implemented with Clerk's getToken
    return {};
  } catch (error) {
    console.error('Error getting auth token:', error);
    return {};
  }
};

// Custom fetch base query with Clerk auth
export const customBaseQuery = async ({ url, method, body, params }, api) => {
  try {
    const token = localStorage.getItem('clerk-token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${url}`, {
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return { data };
  } catch (error) {
    return { error: { message: error.message } };
  }
};