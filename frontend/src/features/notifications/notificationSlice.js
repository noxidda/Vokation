import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ limit = 20, unreadOnly = false }) => ({
        url: `/notifications?limit=${limit}&unreadOnly=${unreadOnly}`,
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;