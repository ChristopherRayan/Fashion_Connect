import { Router } from 'express';
import {
  createPaymentOrder,
  processMobilePayment,
  checkPaymentStatus,
  getPaymentMethods,
  handlePaymentWebhook,
  getPaymentHistory
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.route('/methods').get(getPaymentMethods);
router.route('/webhook').post(handlePaymentWebhook);

// Protected routes (require authentication)
router.use(verifyJWT);

// Payment processing routes
router.route('/create-order').post(createPaymentOrder);
router.route('/mobile-payment').post(processMobilePayment);
router.route('/status/:orderId').get(checkPaymentStatus);
router.route('/history').get(getPaymentHistory);

export default router;
