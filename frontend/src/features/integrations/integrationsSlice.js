import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const integrationsApi = createApi({
  reducerPath: 'integrationsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Integrations'],
  endpoints: (builder) => ({
    getIntegrations: builder.query({
      query: () => '/integrations',
      providesTags: ['Integrations'],
    }),
    connectIntegration: builder.mutation({
      query: ({ platform }) => ({
        url: `/integrations/${platform}/connect`,
        method: 'POST',
      }),
      invalidatesTags: ['Integrations'],
    }),
    disconnectIntegration: builder.mutation({
      query: ({ platform }) => ({
        url: `/integrations/${platform}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Integrations'],
    }),
    syncIntegration: builder.mutation({
      query: ({ platform }) => ({
        url: `/integrations/${platform}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['Integrations'],
    }),
  }),
});

export const {
  useGetIntegrationsQuery,
  useConnectIntegrationMutation,
  useDisconnectIntegrationMutation,
  useSyncIntegrationMutation,
} = integrationsApi;