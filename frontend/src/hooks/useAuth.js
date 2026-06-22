import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

export const useAuth = () => {
  const { isLoaded, isSignedIn, userId, getToken, orgId } = useClerkAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
    getToken,
    orgId,
  };
};

export default useAuth;