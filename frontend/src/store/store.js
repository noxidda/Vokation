import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from '../features/dashboard/dashboardSlice';
import { teamApi } from '../features/team/teamSlice';
import { integrationsApi } from '../features/integrations/integrationsSlice';
import { jobApi } from '../features/jobs/jobSlice';
import { notificationApi } from '../features/notifications/notificationSlice';
import { auditApi } from '../features/audit/auditSlice';
import { paymentApi } from '../features/payment/paymentSlice';

export const store = configureStore({
  reducer: {
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [integrationsApi.reducerPath]: integrationsApi.reducer,
    [jobApi.reducerPath]: jobApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(dashboardApi.middleware)
      .concat(teamApi.middleware)
      .concat(integrationsApi.middleware)
      .concat(jobApi.middleware)
      .concat(notificationApi.middleware)
      .concat(auditApi.middleware)
      .concat(paymentApi.middleware),
});