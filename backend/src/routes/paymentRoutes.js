import express from 'express';
import {
  createOrder,
  verifyPayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;