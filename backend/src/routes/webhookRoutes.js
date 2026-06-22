import express from 'express';
import { razorpayWebhook } from '../controllers/webhookController.js';
import { webhookLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Webhook endpoints - public, no auth required
router.post('/razorpay', express.raw({ type: 'application/json' }), webhookLimiter, razorpayWebhook);

export default router;