import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { organizationId } = req;
    const {
      action,
      userId,
      resource,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const query = { organizationId };
    
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (resource) query.resource = resource;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await AuditLog.countDocuments(query);
    
    res.status(200).json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch audit logs',
    });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const { organizationId } = req;
    const { action, userId, from, to } = req.query;
    
    const query = { organizationId };
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    
    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(10000); // Limit to 10k rows
    
    // Generate CSV
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown',
      log.action,
      log.resource || '',
      log.resourceId || '',
      log.ipAddress || '',
      JSON.stringify(log.details || {}),
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to export audit logs',
    });
  }
};

export const getAuditActions = async (req, res) => {
  try {
    const { organizationId } = req;
    
    const actions = await AuditLog.distinct('action', { organizationId });
    
    res.status(200).json(actions);
  } catch (error) {
    console.error('Get audit actions error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch audit actions',
    });
  }
};