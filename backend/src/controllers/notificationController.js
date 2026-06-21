import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { organizationId } = req;
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { organizationId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      organizationId,
      read: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch notifications',
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { organizationId } = req;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        organizationId,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        error: true,
        message: 'Notification not found',
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark notification as read',
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { organizationId } = req;

    await Notification.updateMany(
      { organizationId, read: false },
      { read: true }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark all notifications as read',
    });
  }
};