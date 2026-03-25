import crypto from 'crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { EmailVerification } from '../../models/emailVerification.model.js';
import { User } from '../../models/user.model.js';
import emailService from '../../services/emailService.js';

// Request email verification
const requestVerification = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  // Validate email
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Check for recent verification requests (rate limiting)
    const recentRequest = await EmailVerification.findOne({
      email: normalizedEmail,
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } // 2 minutes
    });

    if (recentRequest) {
      throw new ApiError(429, 'Please wait 2 minutes before requesting another verification email');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create or update verification record
    const verification = await EmailVerification.createOrUpdateToken(
      normalizedEmail,
      token,
      expiresAt
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(normalizedEmail, token, role);

    console.log(`✅ Verification email requested for: ${normalizedEmail}`);

    res.status(200).json(
      new ApiResponse(200, {
        email: normalizedEmail,
        expiresAt: verification.expiresAt,
        expiresInMinutes: verification.expiresInMinutes,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl // Only in development
      }, 'Verification email sent successfully')
    );

  } catch (error) {
    console.error('Error in requestVerification:', error);
    
    // Handle specific errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      throw new ApiError(429, 'A verification request is already pending for this email');
    }
    
    throw new ApiError(500, 'Failed to send verification email. Please try again.');
  }
});

// Verify email token
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, token } = req.body;

  // Validate required fields
  if (!email || !token) {
    throw new ApiError(400, 'Email and token are required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find verification record
    const verification = await EmailVerification.findValidToken(normalizedEmail, token);

    if (!verification) {
      // Check if there's an expired token
      const expiredToken = await EmailVerification.findOne({
        email: normalizedEmail,
        token
      });

      if (expiredToken) {
        throw new ApiError(410, 'Verification token has expired. Please request a new one.');
      }

      throw new ApiError(404, 'Invalid verification token');
    }

    // Check if token is expired (double check)
    if (verification.isExpired()) {
      await verification.deleteOne();
      throw new ApiError(410, 'Verification token has expired. Please request a new one.');
    }

    // Check if max attempts exceeded
    if (verification.hasExceededAttempts()) {
      await verification.deleteOne();
      throw new ApiError(429, 'Too many verification attempts. Please request a new verification email.');
    }

    // Check if user already exists (race condition protection)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // Clean up verification record
      await verification.deleteOne();
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Token is valid - mark as verified but keep the record for registration
    verification.verified = true;
    verification.verifiedAt = new Date();
    await verification.save();

    console.log(`✅ Email verified successfully: ${normalizedEmail}`);

    res.status(200).json(
      new ApiResponse(200, {
        email: normalizedEmail,
        verified: true,
        verifiedAt: verification.verifiedAt,
        token: verification.token // Include token for registration
      }, 'Email verified successfully. You can now complete your registration.')
    );

  } catch (error) {
    console.error('Error in verifyEmail:', error);
    
    // Increment attempts for rate limiting (if verification exists)
    try {
      const verification = await EmailVerification.findOne({
        email: normalizedEmail,
        token
      });
      if (verification && !verification.isExpired()) {
        await verification.incrementAttempts();
      }
    } catch (incrementError) {
      console.error('Error incrementing attempts:', incrementError);
    }
    
    // Handle specific errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Failed to verify email. Please try again.');
  }
});

// Check verification status
const checkVerificationStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(200).json(
        new ApiResponse(200, {
          email: normalizedEmail,
          status: 'user_exists',
          canRegister: false
        }, 'User already exists with this email')
      );
    }

    // Check for pending verification
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() }
    });

    if (verification) {
      return res.status(200).json(
        new ApiResponse(200, {
          email: normalizedEmail,
          status: 'pending_verification',
          canRegister: false,
          expiresAt: verification.expiresAt,
          expiresInMinutes: verification.expiresInMinutes,
          attempts: verification.attempts
        }, 'Email verification is pending')
      );
    }

    // No verification found - can request new one
    res.status(200).json(
      new ApiResponse(200, {
        email: normalizedEmail,
        status: 'no_verification',
        canRegister: false,
        canRequestVerification: true
      }, 'No verification found for this email')
    );

  } catch (error) {
    console.error('Error in checkVerificationStatus:', error);
    throw new ApiError(500, 'Failed to check verification status');
  }
});

// Resend verification email
const resendVerification = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Find existing verification
    const existingVerification = await EmailVerification.findOne({
      email: normalizedEmail
    });

    if (existingVerification && !existingVerification.isExpired()) {
      // Check rate limiting
      const timeSinceCreated = Date.now() - existingVerification.createdAt.getTime();
      const minWaitTime = 2 * 60 * 1000; // 2 minutes

      if (timeSinceCreated < minWaitTime) {
        const waitTimeRemaining = Math.ceil((minWaitTime - timeSinceCreated) / 1000);
        throw new ApiError(429, `Please wait ${waitTimeRemaining} seconds before requesting another verification email`);
      }
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create or update verification record
    const verification = await EmailVerification.createOrUpdateToken(
      normalizedEmail,
      token,
      expiresAt
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(normalizedEmail, token, role);

    console.log(`✅ Verification email resent for: ${normalizedEmail}`);

    res.status(200).json(
      new ApiResponse(200, {
        email: normalizedEmail,
        expiresAt: verification.expiresAt,
        expiresInMinutes: verification.expiresInMinutes,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl
      }, 'Verification email sent successfully')
    );

  } catch (error) {
    console.error('Error in resendVerification:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Failed to resend verification email');
  }
});

// Clean up expired tokens (utility endpoint for admin/cron)
const cleanupExpiredTokens = asyncHandler(async (req, res) => {
  try {
    const deletedCount = await EmailVerification.cleanupExpired();
    
    console.log(`🧹 Cleaned up ${deletedCount} expired verification tokens`);
    
    res.status(200).json(
      new ApiResponse(200, {
        deletedCount
      }, `Cleaned up ${deletedCount} expired verification tokens`)
    );
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error);
    throw new ApiError(500, 'Failed to cleanup expired tokens');
  }
});

export {
  requestVerification,
  verifyEmail,
  checkVerificationStatus,
  resendVerification,
  cleanupExpiredTokens
};
