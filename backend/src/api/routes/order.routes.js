import { Router } from 'express';
import {
 createOrder,
 getMyOrders,
 getOrderById,
 updateOrderStatus,
 getDesignerOrders,
 approveOrder,
 rejectOrder
} from '../controllers/order.controller.js';
import { createInvoice, downloadInvoiceByOrder } from '../controllers/analytics.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(verifyJWT);

// Client routes
router.route('/').post(createOrder);
router.route('/my-orders').get(getMyOrders);

// Designer routes
router.route('/designer-orders').get(authorizeRoles('DESIGNER'), getDesignerOrders);
router.route('/:orderId/approve').patch(authorizeRoles('DESIGNER'), approveOrder);
router.route('/:orderId/reject').patch(authorizeRoles('DESIGNER'), rejectOrder);

// Shared routes
router.route('/:id').get(getOrderById);
router.route('/:id/status').patch(authorizeRoles('DESIGNER', 'ADMIN'), updateOrderStatus);

// Invoice routes (alternative to analytics routes to avoid ad blocker issues)
router.route('/:orderId/invoice').post(createInvoice);
router.route('/:orderId/invoice/download').get(downloadInvoiceByOrder);
router.route('/:orderId/receipt').get(downloadInvoiceByOrder); // Alternative naming to avoid blocking

export default router;
