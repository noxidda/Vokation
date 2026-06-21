import { createApi } from '@reduxjs/toolkit/query/react';
import { apiClient } from '../../services/apiClient';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: apiClient,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: () => '/dashboard/metrics',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardMetricsQuery } = dashboardApi;