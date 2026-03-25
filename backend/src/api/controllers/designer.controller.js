import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Review } from '../../models/review.model.js';
import { ApiError } from '../../utils/ApiError.js';
const getAllDesigners = asyncHandler(async (req, res) => {
 const {
   page = 1,
   limit = 50,
   sortBy = 'name',
   sortType = 'asc',
   query,
   specialty,
   location,
   customOrders
 } = req.query;

 console.log('Fetching designers with params:', { page, limit, sortBy, sortType, query, specialty, location, customOrders });

 const sortOrder = sortType === 'desc' ? -1 : 1;
 const sortObj = { [sortBy]: sortOrder };

 // Build filter conditions
 const filterConditions = {
   role: 'DESIGNER',
   $or: [
     { status: 'ACTIVE' },
     { status: 'PENDING_VERIFICATION' },
     { status: { $exists: false } }
   ]
 };

 // Add search query filter (search in name, businessName, bio, specialty)
 if (query && query.trim()) {
   const searchRegex = new RegExp(query.trim(), 'i');
   filterConditions.$and = [
     {
       $or: [
         { name: searchRegex },
         { businessName: searchRegex },
         { bio: searchRegex },
         { specialty: searchRegex }
       ]
     }
   ];
 }

 // Add specialty filter
 if (specialty && specialty.trim()) {
   const specialtyRegex = new RegExp(specialty.trim(), 'i');
   if (filterConditions.$and) {
     filterConditions.$and.push({ specialty: specialtyRegex });
   } else {
     filterConditions.specialty = specialtyRegex;
   }
 }

 // Add location filter
 if (location && location.trim()) {
   const locationRegex = new RegExp(location.trim(), 'i');
   if (filterConditions.$and) {
     filterConditions.$and.push({ location: locationRegex });
   } else {
     filterConditions.location = locationRegex;
   }
 }

 // Add custom orders filter
 if (customOrders === 'true') {
   if (filterConditions.$and) {
     filterConditions.$and.push({ customOrdersAvailable: true });
   } else {
     filterConditions.customOrdersAvailable = true;
   }
 }

 console.log('Filter conditions:', JSON.stringify(filterConditions, null, 2));

 // Find designers with filters
 const designers = await User.find(filterConditions)
     .select('name bio specialty experience location businessWebsite profileImage businessName customOrdersAvailable turnaroundTime phone createdAt')
     .sort(sortObj)
     .limit(parseInt(limit))
     .skip((parseInt(page) - 1) * parseInt(limit));

 const totalDesigners = await User.countDocuments(filterConditions);

 // Calculate ratings for each designer
 const designersWithRatings = await Promise.all(
   designers.map(async (designer) => {
     const reviewStats = await Review.aggregate([
       { $match: { designer: designer._id } },
       {
         $group: {
           _id: '$designer',
           averageRating: { $avg: '$rating' },
           totalReviews: { $sum: 1 }
         }
       }
     ]);

     return {
       ...designer.toObject(),
       rating: reviewStats.length > 0 ? reviewStats[0].averageRating : 0,
       reviewCount: reviewStats.length > 0 ? reviewStats[0].totalReviews : 0
     };
   })
 );

 console.log(`Found ${designers.length} designers out of ${totalDesigners} total`);

 const response = {
   docs: designersWithRatings,
   totalDocs: totalDesigners,
   limit: parseInt(limit),
   page: parseInt(page),
   totalPages: Math.ceil(totalDesigners / parseInt(limit)),
   hasNextPage: parseInt(page) < Math.ceil(totalDesigners / parseInt(limit)),
   hasPrevPage: parseInt(page) > 1
 };

 return res.status(200).json(new ApiResponse(200, response, "Designers fetched successfully"));
});
const getDesignerProfile = asyncHandler(async (req, res) => {
 const { designerId } = req.params;
 const designer = await User.findById(designerId)
     .where('role').equals('DESIGNER')
     .select('-password -refreshToken -permissions');
 if (!designer) {
     throw new ApiError(404, "Designer not found");
 }

 // Check if designer is deactivated
 if (designer.status === 'DEACTIVATED') {
     throw new ApiError(404, "Designer not found");
 }

 const products = await Product.find({ designer: designerId }).limit(10);

 // Calculate designer's average rating and review count
 const reviewStats = await Review.aggregate([
   { $match: { designer: designer._id } },
   {
     $group: {
       _id: '$designer',
       averageRating: { $avg: '$rating' },
       totalReviews: { $sum: 1 }
     }
   }
 ]);

 // Add rating information to designer object
 const designerWithRating = {
   ...designer.toObject(),
   rating: reviewStats.length > 0 ? reviewStats[0].averageRating : 0,
   reviewCount: reviewStats.length > 0 ? reviewStats[0].totalReviews : 0,
   totalProducts: products.length
 };

 const profile = {
     designer: designerWithRating,
     products
 };
 return res.status(200).json(new ApiResponse(200, profile, "Designer profile fetched successfully"));
});
const getDesignerDashboardAnalytics = asyncHandler(async (req, res) => {
 // This would contain complex aggregation logic.
 // For now, returning mock data structure.
 const designerId = req.user._id;
 const mockAnalytics = {
   views: 15420,
   orders: 87,
   revenue: 2450000,
   conversionRate: 5.6,
 };
 return res.status(200).json(new ApiResponse(200, mockAnalytics, "Analytics fetched successfully"));
});
export { getAllDesigners, getDesignerProfile, getDesignerDashboardAnalytics };
