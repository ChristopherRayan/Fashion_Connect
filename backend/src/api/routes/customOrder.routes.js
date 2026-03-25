import { Router } from 'express';
import {
  createCustomOrder,
  getMyCustomOrders,
  getCustomOrderById,
  updateCustomOrderStatus,
  getDesignerCustomOrders,
  cancelCustomOrder
} from '../controllers/customOrder.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Client routes
router.route('/').post(authorizeRoles('CLIENT'), createCustomOrder);
router.route('/my-orders').get(authorizeRoles('CLIENT'), getMyCustomOrders);
router.route('/:orderId/cancel').patch(authorizeRoles('CLIENT'), cancelCustomOrder);

// Designer routes
router.route('/designer-orders').get(authorizeRoles('DESIGNER'), getDesignerCustomOrders);
router.route('/:orderId/status').patch(authorizeRoles('DESIGNER'), updateCustomOrderStatus);

// Shared routes
router.route('/:orderId').get(getCustomOrderById);

export default router;
