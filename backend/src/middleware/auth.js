import clerk from '../config/clerk.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'No token provided',
      });
    }
    
    // Verify token with Clerk
    const claims = await clerk.verifyToken(token, { clockSkewInMs: 30000 });

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