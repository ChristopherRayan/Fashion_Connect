import { Router } from 'express';
import {
 getAllUsers,
 updateUserStatus,
 getPendingDesigners,
 approveDesigner,
 rejectDesigner,
 getAdminDashboardAnalytics,
 getAllProductsForModeration,
 removeProduct,
 updateProductStatus,
 getModerationStats,
 deactivateUser,
 updateUser,
 getAllOrders
} from '../controllers/admin.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';
const router = Router();
// All admin routes are protected and require ADMIN role
router.use(verifyJWT, authorizeRoles('ADMIN'));
router.route('/users').get(getAllUsers);
router.route('/users/:userId/status').patch(updateUserStatus);
router.route('/designers/pending').get(getPendingDesigners);
router.route('/designers/:userId/approve').patch(approveDesigner);
router.route('/designers/:userId/reject').patch(rejectDesigner);
router.route('/products').get(getAllProductsForModeration);
router.route('/products/:productId/remove').post(removeProduct);
router.route('/products/:productId/status').patch(updateProductStatus);

// User management routes
router.route('/users/:userId/deactivate').patch(deactivateUser);
router.route('/users/:userId').put(updateUser);
router.route('/moderation/stats').get(getModerationStats);
router.route('/analytics').get(getAdminDashboardAnalytics);
router.route('/orders').get(getAllOrders);
export default router;
