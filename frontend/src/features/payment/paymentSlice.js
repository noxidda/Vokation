import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Payment', 'Subscription'],
  endpoints: (builder) => ({
    getSubscriptionStatus: builder.query({
      query: () => '/payment/subscription-status',
      providesTags: ['Subscription'],
    }),
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/payment/create-order',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/payment/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscription', 'Payment'],
    }),
    getPaymentHistory: builder.query({
      query: () => '/payment/history',
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetSubscriptionStatusQuery,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentHistoryQuery,
} = paymentApi;