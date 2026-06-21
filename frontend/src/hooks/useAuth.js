import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

export const useAuth = () => {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
  };
};

export default useAuth;