import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import teamRoutes from './teamRoutes.js';
import integrationRoutes from './integrationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import jobRoutes from './jobRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);

// Protected routes
router.use('/dashboard', dashboardRoutes);
router.use('/team', teamRoutes);
router.use('/integrations', integrationRoutes);
router.use('/payment', paymentRoutes);
router.use('/jobs', jobRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

export default router;