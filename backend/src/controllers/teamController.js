import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import clerk from '../config/clerk.js';

export const getTeamMembers = async (req, res) => {
  try {
    const { organizationId } = req;

    const members = await User.find({
      organizationId,
    }).select('-__v');

    res.status(200).json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch team members',
    });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { organizationId, user } = req;

    // Only admin can invite
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only admins can invite members',
      });
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: true,
        message: 'Invalid email address',
      });
    }

    // Validate role
    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid role',
      });
    }

    // Check if user already exists in organization
    const existingUser = await User.findOne({
      email,
      organizationId,
    });

    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: 'User already in organization',
      });
    }

    // In a real implementation, you would send an invitation via Clerk
    // For now, we'll just log it
    console.log(`📧 Inviting ${email} as ${role}`);

    // Create audit log
    await AuditLog.create({
      organizationId,
      userId: user._id,
      action: 'invited_teammate',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { email, role },
    });

    res.status(200).json({
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send invitation',
    });
  }
};

export const changeRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const { organizationId, user } = req;

    // Only admin can change roles
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only admins can change roles',
      });
    }

    // Cannot change your own role
    if (userId === user._id.toString()) {
      return res.status(400).json({
        error: true,
        message: 'Cannot change your own role',
      });
    }

    // Validate role
    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid role',
      });
    }

    // Find and update user
    const targetUser = await User.findOne({
      _id: userId,
      organizationId,
    });

    if (!targetUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    targetUser.role = role;
    await targetUser.save();

    // Create audit log
    await AuditLog.create({
      organizationId,
      userId: user._id,
      action: 'changed_role',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { targetUserId: userId, newRole: role },
    });

    res.status(200).json({
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to change role',
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { organizationId, user } = req;

    // Only admin can remove members
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: true,
        message: 'Only admins can remove members',
      });
    }

    // Cannot remove yourself
    if (userId === user._id.toString()) {
      return res.status(400).json({
        error: true,
        message: 'Cannot remove yourself',
      });
    }

    // Find and remove user
    const targetUser = await User.findOneAndDelete({
      _id: userId,
      organizationId,
    });

    if (!targetUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    // Create audit log
    await AuditLog.create({
      organizationId,
      userId: user._id,
      action: 'removed_teammate',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { targetUserId: userId, email: targetUser.email },
    });

    res.status(200).json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to remove member',
    });
  }
};