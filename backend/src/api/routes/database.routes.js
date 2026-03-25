import { Router } from 'express';
import {
  getDatabaseOverview,
  getUsers,
  getProducts,
  getOrders,
  getInvoices,
  getMessages,
  getNotifications,
  getReviews
} from '../controllers/database.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// All database routes require admin access
router.use(verifyJWT, authorizeRoles('ADMIN'));

// Database overview
router.route('/overview').get(getDatabaseOverview);

// Collection data routes
router.route('/users').get(getUsers);
router.route('/products').get(getProducts);
router.route('/orders').get(getOrders);
router.route('/invoices').get(getInvoices);
router.route('/messages').get(getMessages);
router.route('/notifications').get(getNotifications);
router.route('/reviews').get(getReviews);

export default router;
