import { Router } from 'express';
import {
  requestVerification,
  verifyEmail,
  checkVerificationStatus,
  resendVerification,
  cleanupExpiredTokens
} from '../controllers/emailVerification.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/request-verification
 * @desc    Request email verification
 * @access  Public
 * @body    { email: string }
 */
router.post('/request-verification', requestVerification);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 * @body    { email: string, token: string }
 */
router.post('/verify-email', verifyEmail);

/**
 * @route   GET /api/auth/verification-status/:email
 * @desc    Check verification status for an email
 * @access  Public
 * @params  email - The email address to check
 */
router.get('/verification-status/:email', checkVerificationStatus);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 * @body    { email: string }
 */
router.post('/resend-verification', resendVerification);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/cleanup-expired-tokens
 * @desc    Clean up expired verification tokens (admin/cron utility)
 * @access  Private (Admin only)
 */
router.post('/cleanup-expired-tokens', verifyJWT, cleanupExpiredTokens);

export default router;
