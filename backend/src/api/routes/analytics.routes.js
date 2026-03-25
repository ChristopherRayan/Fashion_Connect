import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDailyAnalytics,
  getMonthlyAnalytics,
  createInvoice,
  getUserInvoices,
  downloadInvoice
} from '../controllers/analytics.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Analytics routes
router.route('/dashboard').get(getDashboardAnalytics);
router.route('/daily').get(getDailyAnalytics);
router.route('/monthly').get(getMonthlyAnalytics);

// Invoice routes
router.route('/invoices').get(getUserInvoices);
router.route('/invoices/:orderId').post(createInvoice);
router.route('/invoices/:invoiceId/download').get(downloadInvoice);

export default router;
