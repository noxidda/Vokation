import express from 'express';
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
} from '../controllers/integrationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/', getIntegrations);
router.post('/:platform/connect', connectIntegration);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/sync', syncIntegration);

export default router;