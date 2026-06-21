import express from 'express';
import { clerkWebhook } from '../controllers/authController.js';
import { webhookLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Clerk webhook - public endpoint
router.post('/webhook', webhookLimiter, clerkWebhook);

export default router;