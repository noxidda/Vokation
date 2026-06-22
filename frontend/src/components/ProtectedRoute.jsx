import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetSubscriptionStatusQuery } from '../features/payment/paymentSlice';

export const ProtectedRoute = ({ requiredRole }) => {
  const { isLoaded, isSignedIn, user, getToken, orgId } = useAuth();
  const { data: subscription } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isLoaded || !isSignedIn,
  });

  React.useEffect(() => {
    const syncAuth = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem('clerk-token', token);
          }
          if (orgId) {
            localStorage.setItem('orgId', orgId);
          } else if (user?.organizationMemberships && user.organizationMemberships.length > 0) {
            const activeOrg = user.organizationMemberships[0].organization.id;
            localStorage.setItem('orgId', activeOrg);
          }
        } catch (e) {
          console.error('Error syncing auth:', e);
        }
      } else {
        localStorage.removeItem('clerk-token');
        localStorage.removeItem('orgId');
      }
    };
    syncAuth();
  }, [isSignedIn, getToken, orgId, user]);

  if (!isLoaded) {
    return <div style={{ height: '100vh', background: 'white' }} />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet context={{ subscription }} />;
};

export default ProtectedRoute;