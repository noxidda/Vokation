import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Audit'],
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);
        return `/audit?${params.toString()}`;
      },
      providesTags: ['Audit'],
    }),
    getAuditActions: builder.query({
      query: () => '/audit/actions',
    }),
    exportAuditLogs: builder.mutation({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        return {
          url: `/audit/export?${params.toString()}`,
          method: 'GET',
          responseHandler: 'blob',
        };
      },
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditActionsQuery,
  useExportAuditLogsMutation,
} = auditApi;