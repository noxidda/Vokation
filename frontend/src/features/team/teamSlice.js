import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from '../../services/apiClient';

export const teamApi = createApi({
  reducerPath: 'teamApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Team'],
  endpoints: (builder) => ({
    getTeamMembers: builder.query({
      query: () => '/team',
      providesTags: ['Team'],
    }),
    inviteMember: builder.mutation({
      query: (data) => ({
        url: '/team/invite',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Team'],
    }),
    changeRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/team/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Team'],
    }),
    removeMember: builder.mutation({
      query: (userId) => ({
        url: `/team/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),
  }),
});

export const {
  useGetTeamMembersQuery,
  useInviteMemberMutation,
  useChangeRoleMutation,
  useRemoveMemberMutation,
} = teamApi;