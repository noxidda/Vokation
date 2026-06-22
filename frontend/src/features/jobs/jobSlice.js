import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const jobApi = createApi({
  reducerPath: 'jobApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Jobs'],
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: ({ status, page = 1, limit = 20 }) => ({
        url: `/jobs?status=${status || ''}&page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['Jobs'],
    }),
    getJobStatus: builder.query({
      query: (jobId) => ({
        url: `/jobs/${jobId}/status`,
        method: 'GET',
      }),
      providesTags: ['Jobs'],
    }),
    retryJob: builder.mutation({
      query: (jobId) => ({
        url: `/jobs/${jobId}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['Jobs'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobStatusQuery,
  useRetryJobMutation,
} = jobApi;