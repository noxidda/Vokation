import express from 'express';
import {
  getAuditLogs,
  exportAuditLogs,
  getAuditActions,
} from '../controllers/auditController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/', requirePermission('audit:view'), getAuditLogs);
router.get('/export', requirePermission('data:export'), exportAuditLogs);
router.get('/actions', requirePermission('audit:view'), getAuditActions);

export default router;
