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
  initiateGoogleConnect,
  googleCallback,
  initiateMailchimpConnect,
  mailchimpCallback,
} from '../controllers/integrationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

// Public OAuth Callback endpoints
router.get('/shopify/callback', shopifyCallback);
router.get('/google-analytics/callback', googleCallback);
router.get('/mailchimp/callback', mailchimpCallback);

// Protected routes
router.use(authMiddleware, organizationAccess);

// Connect OAuth initiation endpoints (protected GET routes authenticated via query token)
router.get('/shopify/connect', initiateShopifyConnect);
router.get('/google_analytics/connect', initiateGoogleConnect);
router.get('/mailchimp/connect', initiateMailchimpConnect);

router.get('/', getIntegrations);
router.post('/:platform/connect', connectIntegration);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/sync', syncIntegration);
router.get('/:platform/history', getSyncHistory);
router.post('/jobs/:jobId/retry', retryFailedJob);

export default router;