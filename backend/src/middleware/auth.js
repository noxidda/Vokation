import clerk from '../config/clerk.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Clerk
    const session = await clerk.sessions.verifySession({
      sessionId: token,
    });

    if (!session) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token',
      });
    }

    req.userId = session.userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: true,
      message: 'Authentication failed',
    });
  }
};