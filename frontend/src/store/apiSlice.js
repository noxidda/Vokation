import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      // Headers will be added by the interceptor in apiClient
      return headers;
    },
  }),
  tagTypes: ['Dashboard', 'Team', 'Integrations'],
  endpoints: (builder) => ({}),
});