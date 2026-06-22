import AuditLog from '../models/AuditLog.js';

export const AUDIT_ACTIONS = {
  // Auth actions
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_UP: 'user.signed_up',
  USER_SIGNED_OUT: 'user.signed_out',
  
  // Platform actions
  PLATFORM_CONNECTED: 'platform.connected',
  PLATFORM_DISCONNECTED: 'platform.disconnected',
  PLATFORM_SYNCED: 'platform.synced',
  PLATFORM_SYNC_FAILED: 'platform.sync_failed',
  
  // Team actions
  TEAM_MEMBER_INVITED: 'team.member_invited',
  TEAM_ROLE_CHANGED: 'team.role_changed',
  TEAM_MEMBER_REMOVED: 'team.member_removed',
  
  // Dashboard actions
  DASHBOARD_VIEWED: 'dashboard.viewed',
  
  // Subscription actions
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription.downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  
  // Settings actions
  SETTINGS_UPDATED: 'settings.updated',
  DATA_EXPORTED: 'data.exported',
};

export const logAction = async ({
  organizationId,
  userId,
  action,
  resource,
  resourceId,
  details = {},
  ipAddress,
  userAgent,
}) => {
  try {
    const log = await AuditLog.create({
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
    
    return log;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
};