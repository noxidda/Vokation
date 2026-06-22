import express from 'express';
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  getSyncHistory,
  retryFailedJob,
  initiateShopifyConnect,
  shopifyCallback,
} from '../controllers/integrationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

// Shopify OAuth - public routes (callbacks)
router.get('/shopify/connect', initiateShopifyConnect);
router.get('/shopify/callback', shopifyCallback);

// Protected routes
router.use(authMiddleware, organizationAccess);

router.get('/', getIntegrations);
router.post('/:platform/connect', connectIntegration);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/sync', syncIntegration);
router.get('/:platform/history', getSyncHistory);
router.post('/jobs/:jobId/retry', retryFailedJob);

export default router;