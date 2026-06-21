import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/metrics', getDashboardMetrics);

export default router;