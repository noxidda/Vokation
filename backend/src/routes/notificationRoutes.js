import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;