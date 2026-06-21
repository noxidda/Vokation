import User from '../models/User.js';

export const organizationAccess = async (req, res, next) => {
  try {
    // Find user in MongoDB by Clerk userId
    const user = await User.findOne({ clerkUserId: req.userId });
    
    if (!user) {
      return res.status(403).json({
        error: true,
        message: 'User not found in organization',
      });
    }

    if (!user.organizationId) {
      return res.status(403).json({
        error: true,
        message: 'User has no organization',
      });
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    console.error('Organization access error:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
    });
  }
};