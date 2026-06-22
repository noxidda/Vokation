import { logAction } from '../services/auditService.js';

export const auditLog = (action, resource, getResourceId = null) => {
  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end to log after response
    res.end = function(...args) {
      // Only log if status is 2xx (success)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const organizationId = req.organizationId;
        const userId = req.user?._id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        let resourceId = null;
        if (getResourceId) {
          resourceId = getResourceId(req);
        }
        
        // Log asynchronously
        logAction({
          organizationId,
          userId,
          action,
          resource,
          resourceId,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query,
          },
          ipAddress,
          userAgent,
        }).catch(err => console.error('Audit log error:', err));
      }
      
      // Call original end
      originalEnd.apply(this, args);
    };
    
    next();
  };
};