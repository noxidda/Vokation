import express from 'express';
import {
  getJobs,
  getJobStatusById,
  retryJobById,
} from '../controllers/jobController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/', getJobs);
router.get('/:jobId/status', getJobStatusById);
router.post('/:jobId/retry', retryJobById);

export default router;