import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Product } from '../../models/product.model.js';
import embeddingService from '../../services/embeddingService.js';
import mongoose from 'mongoose';

/**
 * Generate embeddings for all products that don't have them
 */
export const generateEmbeddings = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Starting embedding generation...');
    
    // Find products without embeddings or with outdated embeddings
    const products = await Product.find({
      $or: [
        { textEmbedding: { $exists: false } },
        { textEmbedding: { $size: 0 } },
        { lastEmbeddingUpdate: { $exists: false } }
      ]
    }).limit(100); // Process in batches

    console.log(`📊 Found ${products.length} products to process`);

    let processed = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Generate embedding for this product
        const embedding = embeddingService.generateProductEmbedding(product);
        
        // Update the product with the new embedding
        await Product.findByIdAndUpdate(product._id, {
          textEmbedding: embedding,
          lastEmbeddingUpdate: new Date()
        });
        
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${products.length} products`);
        }
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log(`🎉 Embedding generation complete: ${processed} processed, ${errors} errors`);

    return res.status(200).json(
      new ApiResponse(200, {
        processed,
        errors,
        total: products.length
      }, "Embeddings generated successfully")
    );
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    throw new ApiError(500, "Failed to generate embeddings");
  }
});

/**
 * Find similar products based on a product ID
 */
export const findSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 5 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // Get the target product
  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    throw new ApiError(404, "Product not found");
  }

  // Ensure the target product has an embedding
  let targetEmbedding = targetProduct.textEmbedding;
  if (!targetEmbedding || targetEmbedding.length === 0) {
    console.log(`🔄 Generating embedding for product ${productId}`);
    targetEmbedding = embeddingService.generateProductEmbedding(targetProduct);
    
    // Update the product with the new embedding
    await Product.findByIdAndUpdate(productId, {
      textEmbedding: targetEmbedding,
      lastEmbeddingUpdate: new Date()
    });
  }

  // Find products with embeddings (excluding the target product)
  const candidateProducts = await Product.find({
    _id: { $ne: productId },
    textEmbedding: { $exists: true, $ne: [] }
  })
  .populate('designer', 'name businessName status')
  .limit(50); // Get more candidates for better similarity matching

  // Filter out products from deactivated or suspended designers
  const activeProducts = candidateProducts.filter(product =>
    product.designer && !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
  );

  // Calculate similarities
  const similarities = embeddingService.findSimilarProducts(
    targetEmbedding,
    activeProducts,
    parseInt(limit)
  );

  const similarProducts = similarities.map(({ product, similarity }) => ({
    ...product.toObject(),
    similarity: Math.round(similarity * 100) / 100 // Round to 2 decimal places
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      targetProduct: {
        _id: targetProduct._id,
        name: targetProduct.name,
        category: targetProduct.category
      },
      similarProducts,
      count: similarProducts.length
    }, "Similar products found successfully")
  );
});

/**
 * Search products by text similarity
 */
export const searchSimilarProducts = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, "Search query is required");
  }

  // Generate embedding for the search query
  const queryEmbedding = embeddingService.generateSimpleEmbedding(query);

  // Find products with embeddings
  const candidateProducts = await Product.find({
    textEmbedding: { $exists: true, $ne: [] }
  })
  .populate('designer', 'name businessName status')
  .limit(100); // Get candidates for similarity matching

  // Filter out products from deactivated or suspended designers
  const activeProducts = candidateProducts.filter(product =>
    product.designer && !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
  );

  // Calculate similarities
  const similarities = embeddingService.findSimilarProducts(
    queryEmbedding,
    activeProducts,
    parseInt(limit)
  );

  const searchResults = similarities.map(({ product, similarity }) => ({
    ...product.toObject(),
    similarity: Math.round(similarity * 100) / 100
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      query,
      results: searchResults,
      count: searchResults.length
    }, "Search completed successfully")
  );
});

/**
 * Get recommendations for a user based on their preferences
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const { categories, tags, limit = 8 } = req.query;
  
  // Create a preference text from categories and tags
  const preferenceText = [
    ...(categories ? categories.split(',') : []),
    ...(tags ? tags.split(',') : [])
  ].join(' ');

  if (!preferenceText) {
    // If no preferences, return featured products or random products
    let products = await Product.find({ featured: true })
      .populate('designer', 'name businessName status')
      .limit(parseInt(limit) * 2); // Get more to account for filtering

    // Filter out products from deactivated or suspended designers
    products = products.filter(product =>
      product.designer && !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
    );

    // If no featured products, get random products
    if (products.length === 0) {
      let randomProducts = await Product.find({})
        .populate('designer', 'name businessName status')
        .limit(parseInt(limit) * 2);

      // Filter out products from deactivated or suspended designers
      products = randomProducts.filter(product =>
        product.designer && !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
      );
    }

    // Limit to requested amount
    products = products.slice(0, parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, {
        recommendations: products,
        count: products.length,
        type: 'featured'
      }, "Featured products returned")
    );
  }

  // Generate embedding for preferences
  const preferenceEmbedding = embeddingService.generateSimpleEmbedding(preferenceText);

  // Find products with embeddings
  const candidateProducts = await Product.find({
    textEmbedding: { $exists: true, $ne: [] }
  })
  .populate('designer', 'name businessName status')
  .limit(50);

  // Filter out products from deactivated or suspended designers
  const activeProducts = candidateProducts.filter(product =>
    product.designer && !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
  );

  // Calculate similarities
  const similarities = embeddingService.findSimilarProducts(
    preferenceEmbedding,
    activeProducts,
    parseInt(limit)
  );

  const recommendations = similarities.map(({ product, similarity }) => ({
    ...product.toObject(),
    similarity: Math.round(similarity * 100) / 100
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      preferences: preferenceText,
      recommendations,
      count: recommendations.length,
      type: 'personalized'
    }, "Recommendations generated successfully")
  );
});

/**
 * Get embedding service statistics
 */
export const getEmbeddingStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const productsWithEmbeddings = await Product.countDocuments({
    textEmbedding: { $exists: true, $ne: [] }
  });

  const cacheStats = embeddingService.getCacheStats();

  return res.status(200).json(
    new ApiResponse(200, {
      totalProducts,
      productsWithEmbeddings,
      embeddingCoverage: Math.round((productsWithEmbeddings / totalProducts) * 100),
      cacheStats
    }, "Embedding statistics retrieved successfully")
  );
});
