import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: () => '/dashboard/metrics',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardMetricsQuery } = dashboardApi;