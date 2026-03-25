import { Router } from 'express';
import {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  getComplaintStats,
  deleteComplaint,
  addAdminResponse,
  getComplaintResponses,
  escalateComplaint,
  getUserComplaintsWithStatus
} from '../controllers/complaint.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Client and Designer routes
router.route('/').post(authorizeRoles('CLIENT', 'DESIGNER'), createComplaint);
router.route('/my-complaints').get(authorizeRoles('CLIENT', 'DESIGNER'), getUserComplaints);
router.route('/my-complaints-status').get(authorizeRoles('CLIENT', 'DESIGNER'), getUserComplaintsWithStatus);

// Admin routes
router.route('/all').get(authorizeRoles('ADMIN'), getAllComplaints);
router.route('/stats').get(authorizeRoles('ADMIN'), getComplaintStats);
router.route('/:complaintId').patch(authorizeRoles('ADMIN'), updateComplaint);
router.route('/:complaintId').delete(authorizeRoles('ADMIN'), deleteComplaint);
router.route('/:complaintId/response').post(authorizeRoles('ADMIN'), addAdminResponse);
router.route('/:complaintId/escalate').post(authorizeRoles('ADMIN'), escalateComplaint);

// Shared routes
router.route('/:complaintId').get(getComplaintById);
router.route('/:complaintId/responses').get(getComplaintResponses);

export default router;
