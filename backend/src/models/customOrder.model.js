import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';

const customOrderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  designer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTailor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  productType: { 
    type: String, 
    required: true 
  },
  productReference: {
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    productName: String,
    productImage: String
  },
  color: { 
    type: String, 
    required: true 
  },
  measurements: {
    type: Schema.Types.Mixed,
    required: true
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  deliveryType: {
    type: String,
    enum: ['standard', 'express', 'premium'],
    default: 'standard'
  },
  deliveryTimePrice: {
    type: Number,
    default: 0
  },
  collectionMethod: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  deliveryLocation: {
    type: String,
    required: function() {
      return this.collectionMethod === 'delivery';
    }
  },
  designerShopAddress: {
    type: String,
    required: function() {
      return this.collectionMethod === 'pickup';
    }
  },
  additionalNotes: String,
  estimatedPrice: { 
    type: Number, 
    default: 0 
  },
  estimatedDeliveryDate: Date,
  designerNotes: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'assigned_to_tailor', 'processing', 'tailor_completed', 'ready_for_shipping', 'shipped', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  cancellationReason: String,
  rejectionReason: String,
  completedAt: Date,
  cancelledAt: Date,
  rejectedAt: Date,
  acceptedAt: Date,
  assignedToTailorAt: Date,
  tailorCompletedAt: Date,
  readyForShippingAt: Date,
  shippedAt: Date,
  tailorNotes: String,
  statusHistory: [{
    status: String,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }]
}, { 
  timestamps: true 
});

// Add pagination plugins
customOrderSchema.plugin(mongoosePaginate);
customOrderSchema.plugin(mongooseAggregatePaginate);

// Indexes for better query performance
customOrderSchema.index({ user: 1, createdAt: -1 });
customOrderSchema.index({ designer: 1, createdAt: -1 });
customOrderSchema.index({ assignedTailor: 1, createdAt: -1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ expectedDeliveryDate: 1 });

// Virtual for order age
customOrderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for time until expected delivery
customOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.expectedDeliveryDate) return null;
  return Math.ceil((this.expectedDeliveryDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set status timestamps
customOrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
      case 'assigned_to_tailor':
        if (!this.assignedToTailorAt) this.assignedToTailorAt = now;
        break;
      case 'tailor_completed':
        if (!this.tailorCompletedAt) this.tailorCompletedAt = now;
        break;
      case 'ready_for_shipping':
        if (!this.readyForShippingAt) this.readyForShippingAt = now;
        break;
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
    }
  }
  next();
});

// Static method to get status counts for a designer
customOrderSchema.statics.getDesignerStatusCounts = async function(designerId) {
  const counts = await this.aggregate([
    { $match: { designer: mongoose.Types.ObjectId(designerId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const statusCounts = {
    pending: 0,
    accepted: 0,
    assigned_to_tailor: 0,
    processing: 0,
    tailor_completed: 0,
    ready_for_shipping: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0
  };
  
  counts.forEach(item => {
    statusCounts[item._id] = item.count;
  });
  
  return statusCounts;
};

// Static method to get user's order history summary
customOrderSchema.statics.getUserOrderSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$estimatedPrice' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return summary[0] || {
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    pendingOrders: 0
  };
};

export const CustomOrder = mongoose.model('CustomOrder', customOrderSchema);
