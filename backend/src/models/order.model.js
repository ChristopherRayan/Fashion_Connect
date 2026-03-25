import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
const orderItemSchema = new Schema({
 product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
 name: { type: String, required: true },
 quantity: { type: Number, required: true, min: 1 },
 price: { type: Number, required: true },
 image: { type: Schema.Types.Mixed }, // Can be string or object with url, colorName, colorLabel
 color: { type: String },
 size: { type: String },
 customizations: { type: Schema.Types.Mixed },
 deliveryInfo: {
   type: { type: String },
   days: { type: Number },
   price: { type: Number },
   description: { type: String }
 }
});
const orderSchema = new Schema({
 buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 designer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 assignedTailor: { type: Schema.Types.ObjectId, ref: 'User' }, // Added for custom order assignments
 items: [orderItemSchema],
 totalAmount: { type: Number, required: true },
 status: {
     type: String,
     enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPPING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
     default: 'PENDING'
 },
 shippingAddress: {
     street: String,
     city: String,
     country: String,
     zipCode: String,
     phone: String
 },
 paymentMethod: {
     type: String,
     enum: ['card', 'airtel', 'mobile_money', 'cash_on_delivery'],
     default: 'cash_on_delivery'
 },
 paymentStatus: {
     type: String,
     enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
     default: 'PENDING'
 },
 paymentReference: { type: String }, // Ctech order reference or transaction ID
 paymentPhone: { type: String }, // For mobile payments
 paymentInitiatedAt: { type: Date },
 paidAt: { type: Date },
 shippingMethod: { type: String },
 trackingNumber: { type: String },
 notes: { type: String },
 deliveredAt: { type: Date },
 isCustomOrder: { type: Boolean, default: false },
 customDetails: {
     measurements: Schema.Types.Mixed,
     designNotes: String,
     referenceImages: [String],
     deadline: Date
 }
}, { timestamps: true });

// Add pagination plugins
orderSchema.plugin(mongoosePaginate);
orderSchema.plugin(mongooseAggregatePaginate);

export const Order = mongoose.model('Order', orderSchema);
