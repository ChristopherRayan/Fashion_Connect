import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'TAILOR_INVITATION'],
    default: 'EMAIL_VERIFICATION',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAttemptAt: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
emailVerificationSchema.index({ email: 1, token: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationSchema.index({ type: 1, isUsed: 1, expiresAt: 1 });
emailVerificationSchema.index({ 'metadata.designerId': 1, type: 1, isUsed: 1 });

// Instance method to check if token is expired
emailVerificationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Instance method to check if max attempts reached
emailVerificationSchema.methods.hasExceededAttempts = function() {
  return this.attempts >= 5;
};

// Instance method to increment attempts
emailVerificationSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Static method to clean up expired tokens
emailVerificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

// Static method to find valid token
emailVerificationSchema.statics.findValidToken = async function(email, token) {
  return await this.findOne({
    email: email.toLowerCase(),
    token,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to create or update verification token
emailVerificationSchema.statics.createOrUpdateToken = async function(email, token, expiresAt) {
  const normalizedEmail = email.toLowerCase();
  
  // Remove any existing tokens for this email
  await this.deleteMany({ email: normalizedEmail });
  
  // Create new token
  return await this.create({
    email: normalizedEmail,
    token,
    expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
};

// Pre-save middleware to normalize email
emailVerificationSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Virtual for time remaining
emailVerificationSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return Math.max(0, remaining);
});

// Virtual for formatted expiry time
emailVerificationSchema.virtual('expiresInMinutes').get(function() {
  const remaining = this.timeRemaining;
  return Math.ceil(remaining / (1000 * 60));
});

export const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
