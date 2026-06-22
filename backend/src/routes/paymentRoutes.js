import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getSubscriptionStatus,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.post('/create-order', requirePermission('subscription:manage'), createOrder);
router.post('/verify', requirePermission('subscription:manage'), verifyPayment);
router.get('/history', requirePermission('subscription:manage'), getPaymentHistory);
router.get('/subscription-status', getSubscriptionStatus);

export default router;