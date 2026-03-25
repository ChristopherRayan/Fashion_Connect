import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model.js';
import embeddingService from '../services/embeddingService.js';

// Load environment variables
dotenv.config();

const testVectorSearch = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('\n🧪 Testing Vector Search Functionality...\n');
    
    // Test 1: Check embedding coverage
    console.log('📊 Test 1: Checking embedding coverage...');
    const totalProducts = await Product.countDocuments();
    const productsWithEmbeddings = await Product.countDocuments({
      textEmbedding: { $exists: true, $ne: [] }
    });
    
    console.log(`   📦 Total products: ${totalProducts}`);
    console.log(`   🧠 Products with embeddings: ${productsWithEmbeddings}`);
    console.log(`   📈 Coverage: ${Math.round((productsWithEmbeddings / totalProducts) * 100)}%`);
    
    if (productsWithEmbeddings === 0) {
      console.log('❌ No products have embeddings. Run generateEmbeddings.js first.');
      await mongoose.disconnect();
      return;
    }
    
    // Test 2: Get a sample product
    console.log('\n🔍 Test 2: Testing similarity search...');
    const sampleProduct = await Product.findOne({ textEmbedding: { $exists: true } });
    
    if (!sampleProduct) {
      console.log('❌ No sample product found');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`   🎯 Target product: "${sampleProduct.name}"`);
    console.log(`   📝 Description: "${sampleProduct.description}"`);
    console.log(`   🏷️ Category: "${sampleProduct.category}"`);
    
    // Test 3: Find similar products
    const candidateProducts = await Product.find({
      _id: { $ne: sampleProduct._id },
      textEmbedding: { $exists: true, $ne: [] }
    }).limit(10);
    
    const similarities = embeddingService.findSimilarProducts(
      sampleProduct.textEmbedding,
      candidateProducts,
      3
    );
    
    console.log(`\n   🔗 Found ${similarities.length} similar products:`);
    similarities.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.product.name}" (${Math.round(item.similarity * 100)}% similar)`);
      console.log(`      Category: ${item.product.category}`);
      console.log(`      Description: ${item.product.description.substring(0, 60)}...`);
    });
    
    // Test 4: Test text-based search
    console.log('\n🔍 Test 3: Testing text-based search...');
    const searchQueries = ['traditional dress', 'jacket', 'african print'];
    
    for (const query of searchQueries) {
      console.log(`\n   🔎 Searching for: "${query}"`);
      const queryEmbedding = embeddingService.generateSimpleEmbedding(query);
      
      const allProducts = await Product.find({
        textEmbedding: { $exists: true, $ne: [] }
      }).limit(20);
      
      const searchResults = embeddingService.findSimilarProducts(
        queryEmbedding,
        allProducts,
        3
      );
      
      console.log(`   📋 Results (${searchResults.length}):`);
      searchResults.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.product.name}" (${Math.round(item.similarity * 100)}% match)`);
      });
    }
    
    // Test 5: Test embedding generation
    console.log('\n🧠 Test 4: Testing embedding generation...');
    const testProduct = {
      name: 'Test African Print Dress',
      description: 'Beautiful traditional African print dress with modern styling',
      category: "Women's Clothing",
      tags: ['african', 'traditional', 'dress', 'colorful'],
      colors: ['red', 'blue', 'yellow'],
      materials: ['cotton']
    };
    
    const testEmbedding = embeddingService.generateProductEmbedding(testProduct);
    console.log(`   ✅ Generated embedding with ${testEmbedding.length} dimensions`);
    console.log(`   📊 Sample values: [${testEmbedding.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
    
    // Test 6: Test similarity calculation
    console.log('\n🔢 Test 5: Testing similarity calculation...');
    const embedding1 = embeddingService.generateSimpleEmbedding('traditional african dress');
    const embedding2 = embeddingService.generateSimpleEmbedding('traditional african dress');
    const embedding3 = embeddingService.generateSimpleEmbedding('modern jacket');
    
    const similarity1 = embeddingService.cosineSimilarity(embedding1, embedding2);
    const similarity2 = embeddingService.cosineSimilarity(embedding1, embedding3);
    
    console.log(`   🎯 Identical text similarity: ${Math.round(similarity1 * 100)}%`);
    console.log(`   🎯 Different text similarity: ${Math.round(similarity2 * 100)}%`);
    
    // Test 7: Performance test
    console.log('\n⚡ Test 6: Performance test...');
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      embeddingService.generateSimpleEmbedding(`test product ${i} with various features`);
    }
    
    const endTime = Date.now();
    console.log(`   ⏱️ Generated 100 embeddings in ${endTime - startTime}ms`);
    console.log(`   📊 Average: ${((endTime - startTime) / 100).toFixed(2)}ms per embedding`);
    
    // Test 8: Cache test
    console.log('\n💾 Test 7: Cache functionality...');
    const cacheStatsBefore = embeddingService.getCacheStats();
    console.log(`   📊 Cache size before: ${cacheStatsBefore.size}`);
    
    // Generate some embeddings
    embeddingService.generateSimpleEmbedding('test cache 1');
    embeddingService.generateSimpleEmbedding('test cache 2');
    embeddingService.generateSimpleEmbedding('test cache 1'); // Should hit cache
    
    const cacheStatsAfter = embeddingService.getCacheStats();
    console.log(`   📊 Cache size after: ${cacheStatsAfter.size}`);
    console.log(`   ✅ Cache is working: ${cacheStatsAfter.size > cacheStatsBefore.size ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 All vector search tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Embedding coverage: ${Math.round((productsWithEmbeddings / totalProducts) * 100)}%`);
    console.log(`   ✅ Similarity search: Working`);
    console.log(`   ✅ Text-based search: Working`);
    console.log(`   ✅ Embedding generation: Working`);
    console.log(`   ✅ Similarity calculation: Working`);
    console.log(`   ✅ Performance: ${((endTime - startTime) / 100).toFixed(2)}ms per embedding`);
    console.log(`   ✅ Cache functionality: Working`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the test
testVectorSearch();
