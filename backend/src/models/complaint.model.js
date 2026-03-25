import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const complaintSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'product', 'designer', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  // Enhanced admin response system
  responses: [{
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    isInternal: {
      type: Boolean,
      default: false // false = visible to user, true = internal admin note
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Legacy fields for backward compatibility
  adminResponse: {
    type: String,
    trim: true
  },
  adminUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },

  // Enhanced tracking
  lastResponseAt: {
    type: Date
  },
  userNotified: {
    type: Boolean,
    default: false
  },
  userLastViewedAt: {
    type: Date
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  },
  escalatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    type: String // File URLs
  }],
  // Related entities for context
  relatedOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  relatedDesigner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add pagination plugin
complaintSchema.plugin(mongoosePaginate);

// Index for better query performance
complaintSchema.index({ user: 1, status: 1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ createdAt: -1 });

// Update resolvedAt when status changes to resolved
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  // Update lastResponseAt when new response is added
  if (this.isModified('responses') && this.responses.length > 0) {
    this.lastResponseAt = new Date();
    this.userNotified = false; // Reset notification flag
  }

  next();
});

// Instance methods
complaintSchema.methods.addResponse = function(adminUserId, message, isInternal = false, attachments = []) {
  this.responses.push({
    adminUser: adminUserId,
    message: message.trim(),
    isInternal,
    attachments,
    createdAt: new Date()
  });

  this.lastResponseAt = new Date();
  this.userNotified = false;

  return this.save();
};

complaintSchema.methods.markUserViewed = function() {
  this.userLastViewedAt = new Date();
  return this.save();
};

complaintSchema.methods.escalate = function(adminUserId) {
  this.escalated = true;
  this.escalatedAt = new Date();
  this.escalatedBy = adminUserId;
  this.priority = 'urgent';
  return this.save();
};

complaintSchema.methods.getPublicResponses = function() {
  return this.responses.filter(response => !response.isInternal);
};

complaintSchema.methods.hasUnreadResponses = function() {
  if (!this.userLastViewedAt) return this.responses.length > 0;

  return this.responses.some(response =>
    !response.isInternal && response.createdAt > this.userLastViewedAt
  );
};

// Static methods
complaintSchema.statics.getComplaintWithResponses = function(complaintId, includeInternal = false) {
  const pipeline = [
    { $match: { _id: mongoose.Types.ObjectId(complaintId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'responses.adminUser',
        foreignField: '_id',
        as: 'responseAdmins'
      }
    },
    {
      $addFields: {
        responses: {
          $map: {
            input: includeInternal ? '$responses' : {
              $filter: {
                input: '$responses',
                cond: { $eq: ['$$this.isInternal', false] }
              }
            },
            as: 'response',
            in: {
              $mergeObjects: [
                '$$response',
                {
                  adminUser: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$responseAdmins',
                          cond: { $eq: ['$$this._id', '$$response.adminUser'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        responseAdmins: 0,
        'responses.adminUser.password': 0,
        'responses.adminUser.email': 0,
        'user.password': 0
      }
    }
  ];

  return this.aggregate(pipeline);
};

export const Complaint = mongoose.model('Complaint', complaintSchema);
