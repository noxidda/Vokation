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
    const claims = await clerk.verifyToken(token);

    if (!claims) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token',
      });
    }

    req.userId = claims.sub;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: true,
      message: 'Authentication failed',
    });
  }
};