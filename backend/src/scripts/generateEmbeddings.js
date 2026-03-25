import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model.js';
import embeddingService from '../services/embeddingService.js';

// Load environment variables
dotenv.config();

const generateEmbeddings = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('🔄 Starting embedding generation...');
    
    // Find products without embeddings
    const products = await Product.find({
      $or: [
        { textEmbedding: { $exists: false } },
        { textEmbedding: { $size: 0 } },
        { lastEmbeddingUpdate: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${products.length} products to process`);

    if (products.length === 0) {
      console.log('✅ All products already have embeddings!');
      await mongoose.disconnect();
      return;
    }

    let processed = 0;
    let errors = 0;

    for (const product of products) {
      try {
        console.log(`🔄 Processing: ${product.name}`);
        
        // Generate embedding for this product
        const embedding = embeddingService.generateProductEmbedding(product);
        
        // Update the product with the new embedding
        await Product.findByIdAndUpdate(product._id, {
          textEmbedding: embedding,
          lastEmbeddingUpdate: new Date()
        });
        
        processed++;
        console.log(`✅ [${processed}/${products.length}] Generated embedding for: ${product.name}`);
        
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n🎉 Embedding generation complete!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📈 Success rate: ${Math.round((processed / products.length) * 100)}%`);

    // Show some statistics
    const totalProducts = await Product.countDocuments();
    const productsWithEmbeddings = await Product.countDocuments({
      textEmbedding: { $exists: true, $ne: [] }
    });

    console.log(`\n📈 Database Statistics:`);
    console.log(`   📦 Total products: ${totalProducts}`);
    console.log(`   🧠 Products with embeddings: ${productsWithEmbeddings}`);
    console.log(`   📊 Coverage: ${Math.round((productsWithEmbeddings / totalProducts) * 100)}%`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
generateEmbeddings();
