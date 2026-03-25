import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const productSchema = new Schema({
 name: { type: String, required: true, trim: true },
 description: { type: String, required: true },
 price: { type: Number, required: true },
 discountPrice: { type: Number },
 // Support both legacy string URLs and rich objects with color metadata
 images: {
   type: [Schema.Types.Mixed],
   validate: {
     validator: function(v) { return Array.isArray(v) && v.length > 0; },
     message: 'At least one product image is required'
   }
 },
 category: { type: String, required: true, index: true },
 subcategory: { type: String },
 tags: [{ type: String, index: true }],
 designer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 sizes: [{ type: String }],
 colors: [{ type: String }],
 materials: [{ type: String }],
 inStock: { type: Boolean, default: true },
 stockQuantity: { type: Number, default: 1 },
 // Size-specific stock quantities for ready-made products
 sizeStock: [{
   size: { type: String, required: true },
   quantity: { type: Number, required: true, default: 0 }
 }],
 rating: { type: Number, default: 0 },
 reviewCount: { type: Number, default: 0 },
 featured: { type: Boolean, default: false },
 customizable: { type: Boolean, default: false },

 // Delivery time options for custom orders
 deliveryTimeOptions: {
   standard: {
     enabled: { type: Boolean, default: true },
     days: { type: Number, default: 14 }, // Default 14 days
     description: { type: String, default: 'Standard delivery' },
     price: { type: Number, default: 0 } // Additional price for this delivery option
   },
   express: {
     enabled: { type: Boolean, default: false },
     days: { type: Number, default: 7 }, // Default 7 days
     description: { type: String, default: 'Express delivery' },
     price: { type: Number, default: 0 } // Additional price for this delivery option
   },
   premium: {
     enabled: { type: Boolean, default: false },
     days: { type: Number, default: 3 }, // Default 3 days
     description: { type: String, default: 'Premium delivery' },
     price: { type: Number, default: 0 } // Additional price for this delivery option
   }
 },

 // Measurement configuration for customizable products
 measurementConfig: {
   enabled: { type: Boolean, default: false },
   guideImage: { type: String }, // URL to measurement guide image
   requiredMeasurements: [{
     category: { type: String, required: true }, // e.g., 'shirts', 'trousers', 'suits_jacket'
     measurements: [{
       field: { type: String, required: true }, // e.g., 'neck', 'chest', 'waist'
       label: { type: String, required: true }, // Display name
       required: { type: Boolean, default: true },
       unit: { type: String, default: 'inches' },
       placeholder: { type: String },
       helpText: { type: String }
     }]
   }]
 },

 // Vector embeddings for similarity search
 textEmbedding: {
   type: [Number],
   index: true,
   default: undefined // Will be generated from name + description + tags
 },
 lastEmbeddingUpdate: { type: Date }
}, { timestamps: true });

// Method to calculate total stock from size-specific stock
productSchema.methods.calculateTotalStock = function() {
  if (this.sizeStock && this.sizeStock.length > 0) {
    return this.sizeStock.reduce((total, sizeItem) => total + sizeItem.quantity, 0);
  }
  return this.stockQuantity;
};

// Pre-save middleware to auto-calculate total stock
productSchema.pre('save', function(next) {
  if (this.sizeStock && this.sizeStock.length > 0) {
    const totalStock = this.sizeStock.reduce((total, sizeItem) => total + sizeItem.quantity, 0);
    this.stockQuantity = totalStock;
    this.inStock = totalStock > 0;
  }
  next();
});

productSchema.plugin(mongooseAggregatePaginate);
export const Product = mongoose.model('Product', productSchema);
