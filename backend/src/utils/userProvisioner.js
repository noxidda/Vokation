import User from '../models/User.js';
import Organization from '../models/Organization.js';
import clerk from '../config/clerk.js';

export const getOrCreateUser = async (clerkUserId) => {
  let user = await User.findOne({ clerkUserId });
  
  if (!user) {
    console.log(`[Auth] User ${clerkUserId} not found in DB. Attempting auto-provisioning...`);
    try {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      if (clerkUser) {
        const email = clerkUser.emailAddresses.find(
          (addr) => addr.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
        
        const firstName = clerkUser.firstName || email.split('@')[0];
        const lastName = clerkUser.lastName || 'User';
        
        if (email) {
          // Create organization
          const organization = await Organization.create({
            name: `${firstName}'s Company`,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
          });

          // Create user
          user = await User.create({
            clerkUserId,
            email,
            firstName,
            lastName,
            organizationId: organization._id,
            role: 'admin',
          });
          console.log(`[Auth] Auto-provisioned user in DB: ${email} (${clerkUserId})`);
        }
      }
    } catch (clerkError) {
      console.error('[Auth] Failed to auto-provision user from Clerk:', clerkError);
    }
  }
  return user;
};
