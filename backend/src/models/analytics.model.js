import mongoose, { Schema } from 'mongoose';

// Daily analytics schema for tracking daily metrics
const dailyAnalyticsSchema = new Schema({
  date: { type: Date, required: true, unique: true },
  orders: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    confirmed: { type: Number, default: 0 },
    processing: { type: Number, default: 0 },
    shipped: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 }
  },
  revenue: {
    total: { type: Number, default: 0 },
    byPaymentMethod: {
      mobile_money: { type: Number, default: 0 },
      bank_transfer: { type: Number, default: 0 },
      cash_on_delivery: { type: Number, default: 0 }
    }
  },
  users: {
    newRegistrations: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 }
  },
  products: {
    totalViews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Monthly analytics schema for aggregated monthly data
const monthlyAnalyticsSchema = new Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  orders: {
    total: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  users: {
    newRegistrations: { type: Number, default: 0 },
    totalActive: { type: Number, default: 0 }
  },
  topProducts: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    sales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }],
  topDesigners: [{
    designer: { type: Schema.Types.ObjectId, ref: 'User' },
    orders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Create compound index for year and month
monthlyAnalyticsSchema.index({ year: 1, month: 1 }, { unique: true });

// Product analytics schema for tracking individual product performance
const productAnalyticsSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  addToCartCount: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 } // sales / views
}, { timestamps: true });

// Create compound index for product and date
productAnalyticsSchema.index({ product: 1, date: 1 }, { unique: true });

// User analytics schema for tracking user behavior
const userAnalyticsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  pageViews: { type: Number, default: 0 },
  sessionDuration: { type: Number, default: 0 }, // in minutes
  ordersPlaced: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  productsViewed: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

// Create compound index for user and date
userAnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });

// Invoice schema for order invoices
const invoiceSchema = new Schema({
  invoiceNumber: { type: String, unique: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  designer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'MWK' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  paidDate: { type: Date },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'], 
    default: 'DRAFT' 
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    country: String,
    zipCode: String,
    phone: String,
    email: String
  },
  notes: { type: String }
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      console.log('Generating invoice number...');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Count existing invoices for this month
      const startOfMonth = new Date(year, now.getMonth(), 1);
      const startOfNextMonth = new Date(year, now.getMonth() + 1, 1);

      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lt: startOfNextMonth
        }
      });

      this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      console.log('Generated invoice number:', this.invoiceNumber);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      this.invoiceNumber = `INV-${Date.now()}`;
      console.log('Fallback invoice number:', this.invoiceNumber);
    }
  }
  next();
});

export const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
export const MonthlyAnalytics = mongoose.model('MonthlyAnalytics', monthlyAnalyticsSchema);
export const ProductAnalytics = mongoose.model('ProductAnalytics', productAnalyticsSchema);
export const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
