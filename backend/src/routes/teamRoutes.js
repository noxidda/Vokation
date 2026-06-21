import express from 'express';
import {
  getTeamMembers,
  inviteMember,
  changeRole,
  removeMember,
} from '../controllers/teamController.js';
import { authMiddleware } from '../middleware/auth.js';
import { organizationAccess } from '../middleware/organizationAccess.js';

const router = express.Router();

router.use(authMiddleware, organizationAccess);

router.get('/', getTeamMembers);
router.post('/invite', inviteMember);
router.patch('/:userId/role', changeRole);
router.delete('/:userId', removeMember);

export default router;