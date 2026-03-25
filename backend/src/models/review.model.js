import mongoose, { Schema } from 'mongoose';
const designerResponseSchema = new Schema({
 comment: { type: String, required: true },
 date: { type: Date, default: Date.now }
});
const reviewSchema = new Schema({
 product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
 user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 designer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 rating: { type: Number, required: true, min: 1, max: 5 },
 title: { type: String, required: true },
 comment: { type: String, required: true },
 images: [{ type: String }],
 verified: { type: Boolean, default: false }, // e.g., verified purchase
 helpfulCount: { type: Number, default: 0 },
 designerResponse: designerResponseSchema
}, { timestamps: true });
// After a review is saved, update the product's average rating and review count
reviewSchema.statics.calculateAverageRating = async function(productId) {
 const stats = await this.aggregate([
     { $match: { product: productId } },
     {
         $group: {
             _id: '$product',
             nRating: { $sum: 1 },
             avgRating: { $avg: '$rating' }
         }
     }
 ]);
 if (stats.length > 0) {
     await mongoose.model('Product').findByIdAndUpdate(productId, {
         reviewCount: stats[0].nRating,
         rating: stats[0].avgRating
     });
 } else {
     await mongoose.model('Product').findByIdAndUpdate(productId, {
         reviewCount: 0,
         rating: 0
     });
 }
};
reviewSchema.post('save', function() {
 this.constructor.calculateAverageRating(this.product);
});
reviewSchema.post('remove', function() {
 this.constructor.calculateAverageRating(this.product);
});
export const Review = mongoose.model('Review', reviewSchema);
