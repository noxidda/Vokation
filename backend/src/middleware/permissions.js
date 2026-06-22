import { logAction } from '../services/auditService.js';

const PERMISSIONS = {
  // Viewer permissions
  viewer: [
    'dashboard:view',
    'platforms:view',
    'platforms:sync',
    'team:view',
  ],
  
  // Admin permissions (includes all viewer permissions)
  admin: [
    'dashboard:view',
    'platforms:view',
    'platforms:connect',
    'platforms:disconnect',
    'platforms:sync',
    'team:view',
    'team:invite',
    'team:change_role',
    'team:remove',
    'settings:view',
    'settings:edit',
    'audit:view',
    'subscription:manage',
    'data:export',
  ],
};

export const hasPermission = (role, action) => {
  if (!role) return false;
  const permissions = PERMISSIONS[role] || [];
  return permissions.includes(action);
};

export const requirePermission = (action) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!hasPermission(userRole, action)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to perform this action',
      });
    }
    
    next();
  };
};

export const requireAdmin = (req, res, next) => {
  const userRole = req.user?.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      error: true,
      message: 'Admin access required',
    });
  }
  
  next();
};