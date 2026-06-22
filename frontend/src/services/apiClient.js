import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for regular API calls
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// RTK Query base query with auth
export const customBaseQuery = async (args, api) => {
  try {
    const token = localStorage.getItem('clerk-token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
    const body = typeof args === 'string' ? undefined : args.body;
    const params = typeof args === 'string' ? undefined : args.params;

    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const fullUrl = `${API_URL}${normalizedUrl}${queryParams ? `?${queryParams}` : ''}`;

    const response = await fetch(fullUrl, {
      method,
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