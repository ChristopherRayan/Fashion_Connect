import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Product } from '../../models/product.model.js';
import { Review } from '../../models/review.model.js';
import embeddingService from '../../services/embeddingService.js';
import mongoose from 'mongoose';
const getAllProducts = asyncHandler(async (req, res) => {
 const { page = 1, limit = 10, query, category, designer, sortBy, sortType, hasDiscount, customizable } = req.query;
 
 const pipeline = [];
 // Match stage for filtering
 const matchStage = {};
 if (query) {
     matchStage.$or = [
         { name: { $regex: query, $options: 'i' } },
         { description: { $regex: query, $options: 'i' } },
         { tags: { $regex: query, $options: 'i' } }
     ];
 }
 if (category) {
     // Handle main category groups with partial matching
     switch(category.toLowerCase()) {
       case 'men':
         matchStage.category = { $regex: new RegExp("men", "i") };
         break;
       case 'women':
         matchStage.category = { $regex: new RegExp("women", "i") };
         break;
       case 'kids':
         matchStage.category = { $regex: new RegExp("(kids|children)", "i") };
         break;
       case 'accessories':
         matchStage.category = { $regex: new RegExp("accessories", "i") };
         break;
       default:
         // For other categories, use exact match
         matchStage.category = category;
     }
 }
 if (designer) {
     // Assuming designer is passed as an ID
     matchStage.designer = new mongoose.Types.ObjectId(designer);
 }

 // Filter for products with discounts
 if (hasDiscount === 'true') {
     matchStage.discountPrice = { $exists: true, $ne: null, $gt: 0 };
 }

 // Filter for customizable products
 if (customizable === 'true') {
     matchStage.customizable = true;
 }
 
 if (Object.keys(matchStage).length > 0) {
     pipeline.push({ $match: matchStage });
 }
 // Sort stage
 const sortStage = {};
 if (sortBy) {
     sortStage[sortBy] = sortType === 'desc' ? -1 : 1;
 } else {
     sortStage.createdAt = -1; // Default sort
 }
 pipeline.push({ $sort: sortStage });

 // Add lookup to populate designer information
 pipeline.push({
   $lookup: {
     from: 'users',
     localField: 'designer',
     foreignField: '_id',
     as: 'designer',
     pipeline: [
       { $project: { name: 1, specialty: 1, businessName: 1, businessAddress: 1, status: 1 } }
     ]
   }
 });

 // Unwind the designer array to get a single object
 pipeline.push({
   $unwind: {
     path: '$designer',
     preserveNullAndEmptyArrays: true
   }
 });

 // Filter out products from deactivated or suspended designers
 pipeline.push({
   $match: {
     'designer.status': { $nin: ['DEACTIVATED', 'SUSPENDED'] }
   }
 });

 // Add field to match frontend expectations
 pipeline.push({
   $addFields: {
     isFeatured: '$featured'
   }
 });

 const aggregate = Product.aggregate(pipeline);
 const products = await Product.aggregatePaginate(aggregate, { page, limit });
 return res.status(200).json(new ApiResponse(200, products, "Products fetched successfully"));
});
const getProductById = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const product = await Product.findById(productId).populate('designer', 'name specialty status businessAddress');
 if (!product) {
     throw new ApiError(404, "Product not found");
 }

 // Check if the designer is deactivated or suspended
 if (product.designer && ['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)) {
     throw new ApiError(404, "Product not found");
 }

 return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});
const createProduct = asyncHandler(async (req, res) => {
 // Assuming req.user is a designer
 const designerId = req.user._id;
 const productData = { ...req.body, designer: designerId };

 // Generate embedding for the new product
 const embedding = embeddingService.generateProductEmbedding(productData);
 productData.textEmbedding = embedding;
 productData.lastEmbeddingUpdate = new Date();

 const product = await Product.create(productData);
 const populatedProduct = await Product.findById(product._id).populate('designer', 'name specialty businessName');

 console.log(`✅ Created product with embedding: ${product.name}`);
 return res.status(201).json(new ApiResponse(201, populatedProduct, "Product created successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const designerId = req.user._id;

 // Find the product and check if it belongs to the designer
 const product = await Product.findById(productId);
 if (!product) {
     throw new ApiError(404, "Product not found");
 }

 // Check if the product belongs to the current designer (unless admin)
 if (req.user.role !== 'ADMIN' && product.designer.toString() !== designerId.toString()) {
     throw new ApiError(403, "You can only update your own products");
 }

 // Generate new embedding if content has changed
 const updateData = { ...req.body };
 const contentFields = ['name', 'description', 'category', 'subcategory', 'tags', 'colors', 'materials'];
 const hasContentChange = contentFields.some(field => updateData[field] !== undefined);

 if (hasContentChange) {
   const mergedData = { ...product.toObject(), ...updateData };
   const embedding = embeddingService.generateProductEmbedding(mergedData);
   updateData.textEmbedding = embedding;
   updateData.lastEmbeddingUpdate = new Date();
   console.log(`🔄 Updated embedding for product: ${product.name}`);
 }

 const updatedProduct = await Product.findByIdAndUpdate(
     productId,
     updateData,
     { new: true, runValidators: true }
 ).populate('designer', 'name specialty businessName');

 return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const designerId = req.user._id;

 // Find the product and check if it belongs to the designer
 const product = await Product.findById(productId);
 if (!product) {
     throw new ApiError(404, "Product not found");
 }

 // Check if the product belongs to the current designer (unless admin)
 if (req.user.role !== 'ADMIN' && product.designer.toString() !== designerId.toString()) {
     throw new ApiError(403, "You can only delete your own products");
 }

 await Product.findByIdAndDelete(productId);
 return res.status(200).json(new ApiResponse(200, null, "Product deleted successfully"));
});

const getDesignerProducts = asyncHandler(async (req, res) => {
 const { page = 1, limit = 10, query, category, sortBy, sortType } = req.query;
 const designerId = req.user._id;

 const pipeline = [];

 // Match stage for filtering by designer and other criteria
 const matchStage = { designer: new mongoose.Types.ObjectId(designerId) };

 if (query) {
     matchStage.$or = [
         { name: { $regex: query, $options: 'i' } },
         { description: { $regex: query, $options: 'i' } },
         { tags: { $regex: query, $options: 'i' } }
     ];
 }

 if (category) {
     // Handle main category groups with partial matching
     switch(category.toLowerCase()) {
       case 'men':
         matchStage.category = { $regex: new RegExp("men", "i") };
         break;
       case 'women':
         matchStage.category = { $regex: new RegExp("women", "i") };
         break;
       case 'kids':
         matchStage.category = { $regex: new RegExp("(kids|children)", "i") };
         break;
       case 'accessories':
         matchStage.category = { $regex: new RegExp("accessories", "i") };
         break;
       default:
         // For other categories, use exact match
         matchStage.category = category;
     }
 }

 pipeline.push({ $match: matchStage });

 // Sort stage
 const sortStage = {};
 if (sortBy) {
     sortStage[sortBy] = sortType === 'desc' ? -1 : 1;
 } else {
     sortStage.createdAt = -1; // Default sort
 }
 pipeline.push({ $sort: sortStage });

 // Add lookup to populate designer information
 pipeline.push({
   $lookup: {
     from: 'users',
     localField: 'designer',
     foreignField: '_id',
     as: 'designer',
     pipeline: [
       { $project: { name: 1, specialty: 1, businessName: 1 } }
     ]
   }
 });

 // Unwind the designer array to get a single object
 pipeline.push({
   $unwind: {
     path: '$designer',
     preserveNullAndEmptyArrays: true
   }
 });

 // Add field to match frontend expectations
 pipeline.push({
   $addFields: {
     isFeatured: '$featured'
   }
 });

 const aggregate = Product.aggregate(pipeline);
 const products = await Product.aggregatePaginate(aggregate, { page, limit });

 return res.status(200).json(new ApiResponse(200, products, "Designer products fetched successfully"));
});
const getProductReviews = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const reviews = await Review.find({ product: productId }).populate('user', 'name');
 return res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});
const createProductReview = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const { rating, title, comment } = req.body;
 const userId = req.user._id;
 const product = await Product.findById(productId);
 if (!product) {
     throw new ApiError(404, "Product not found");
 }
 // Check if user has already reviewed
 const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
 if (alreadyReviewed) {
     throw new ApiError(400, "You have already reviewed this product");
 }
 const review = await Review.create({
     product: productId,
     user: userId,
     designer: product.designer,
     rating,
     title,
     comment
 });
 return res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
});
// Get all unique categories
const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Product.distinct('category');

    // Filter out empty/null categories and sort alphabetically
    const validCategories = categories
      .filter(category => category && category.trim())
      .sort();

    // If no categories exist in database, return default categories
    if (validCategories.length === 0) {
      const defaultCategories = [
        "Men's - Top",
        "Men's - Bottom",
        "Women's - Top",
        "Women's - Bottom",
        "Unisex - Top",
        "Unisex - Bottom",
        "Accessories",
        "Footwear",
        "Traditional Wear",
        "Custom",
        "Wedding & Bridal",
        "Formal Wear",
        "Casual Wear",
        "Kids & Children",
        "Bags & Purses",
        "Jewelry",
        "Hats & Headwear",
        "Sportswear",
        "Vintage & Retro",
        "Plus Size"
      ];
      return res.status(200).json(new ApiResponse(200, defaultCategories, "Default categories fetched successfully"));
    }

    return res.status(200).json(new ApiResponse(200, validCategories, "Categories fetched successfully"));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new ApiError(500, "Failed to fetch categories");
  }
});

// Get category statistics with product counts
const getCategoryStats = asyncHandler(async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          category: '$_id',
          productCount: '$count',
          averagePrice: { $round: ['$avgPrice', 0] },
          priceRange: {
            min: '$minPrice',
            max: '$maxPrice'
          },
          _id: 0
        }
      }
    ]);

    return res.status(200).json(new ApiResponse(200, categoryStats, "Category statistics fetched successfully"));
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    throw new ApiError(500, "Failed to fetch category statistics");
  }
});

// Get out of stock products count for designer
const getOutOfStockCount = asyncHandler(async (req, res) => {
  const designerId = req.user._id;

  try {
    const outOfStockCount = await Product.countDocuments({
      designer: designerId,
      $or: [
        { inStock: false },
        { stockQuantity: { $lte: 0 } }
      ]
    });

    return res.status(200).json(new ApiResponse(200, { count: outOfStockCount }, "Out of stock count fetched successfully"));
  } catch (error) {
    console.error('Error fetching out of stock count:', error);
    throw new ApiError(500, "Failed to fetch out of stock count");
  }
});

// Debug endpoint to check product stock
const getProductStock = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const stockInfo = {
        productId: product._id,
        productName: product.name,
        totalStock: product.stockQuantity,
        inStock: product.inStock,
        sizeStock: product.sizeStock || [],
        calculatedTotalFromSizes: product.sizeStock ?
            product.sizeStock.reduce((total, sizeItem) => total + sizeItem.quantity, 0) :
            'N/A'
    };

    return res.status(200).json(new ApiResponse(200, stockInfo, "Product stock information"));
});

export { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getDesignerProducts, getProductReviews, createProductReview, getCategories, getCategoryStats, getOutOfStockCount, getProductStock };
