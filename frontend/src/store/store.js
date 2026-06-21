import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from '../features/dashboard/dashboardSlice';
import { teamApi } from '../features/team/teamSlice';
import { integrationsApi } from '../features/integrations/integrationsSlice';

export const store = configureStore({
  reducer: {
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [integrationsApi.reducerPath]: integrationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(dashboardApi.middleware)
      .concat(teamApi.middleware)
      .concat(integrationsApi.middleware),
});