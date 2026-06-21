import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import teamRoutes from './teamRoutes.js';
import integrationRoutes from './integrationRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/dashboard', dashboardRoutes);
router.use('/team', teamRoutes);
router.use('/integrations', integrationRoutes);
router.use('/payment', paymentRoutes);

export default router;