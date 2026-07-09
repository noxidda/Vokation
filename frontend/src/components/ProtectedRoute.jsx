import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetSubscriptionStatusQuery } from '../features/payment/paymentSlice';

export const ProtectedRoute = ({ requiredRole }) => {
  const { isLoaded, isSignedIn, user, getToken, orgId } = useAuth();
  const [authSynced, setAuthSynced] = useState(false);
  const { data: subscription } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isLoaded || !isSignedIn || !authSynced,
  });

  useEffect(() => {
    let intervalId;
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
          setAuthSynced(true);
        } catch (e) {
          console.error('Error syncing auth:', e);
          setAuthSynced(false);
        }
      } else {
        localStorage.removeItem('clerk-token');
        localStorage.removeItem('orgId');
        setAuthSynced(false);
      }
    };
    
    syncAuth();

    if (isSignedIn) {
      intervalId = setInterval(async () => {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem('clerk-token', token);
          }
        } catch (e) {
          console.error('Error refreshing token in interval:', e);
        }
      }, 40000);
    }

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem('clerk-token', token);
          }
        } catch (e) {
          console.error('Error refreshing token on visibility change:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isSignedIn, getToken, orgId, user]);

  if (!isLoaded || (isSignedIn && !authSynced)) {
    return <div style={{ height: '100vh', background: '#000000' }} />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  const activeMembership = user?.organizationMemberships?.find(
    (membership) => membership.organization?.id === orgId,
  ) || user?.organizationMemberships?.[0];

  if (requiredRole && activeMembership?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet context={{ subscription }} />;
};

export default ProtectedRoute;