import { Router } from 'express';
import {
 getAllDesigners,
 getDesignerProfile,
 getDesignerDashboardAnalytics
} from '../controllers/designer.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';
const router = Router();
// Public routes
router.route('/').get(getAllDesigners);
router.route('/:designerId').get(getDesignerProfile);
// Designer dashboard routes
router.route('/dashboard/analytics').get(verifyJWT, authorizeRoles('DESIGNER'), getDesignerDashboardAnalytics);
export default router;
