import mongoose from 'mongoose';
import { Product } from '../src/models/product.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const checkDeliveryOptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all products
    const allProducts = await Product.find({}).select('name customizable deliveryTimeOptions');
    console.log(`\n📦 Total products: ${allProducts.length}`);

    // Check customizable products
    const customizableProducts = allProducts.filter(p => p.customizable);
    console.log(`🎨 Customizable products: ${customizableProducts.length}`);

    // Check products with delivery options
    const productsWithDeliveryOptions = allProducts.filter(p => p.deliveryTimeOptions);
    console.log(`🚚 Products with delivery options: ${productsWithDeliveryOptions.length}`);

    console.log('\n📋 Detailed breakdown:');
    console.log('='.repeat(80));

    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Customizable: ${product.customizable ? '✅' : '❌'}`);
      
      if (product.deliveryTimeOptions) {
        console.log(`   Delivery Options: ✅`);
        console.log(`     Standard: ${product.deliveryTimeOptions.standard?.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.standard?.days || 'N/A'} days, MWK ${product.deliveryTimeOptions.standard?.price || 0})`);
        console.log(`     Express:  ${product.deliveryTimeOptions.express?.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.express?.days || 'N/A'} days, MWK ${product.deliveryTimeOptions.express?.price || 0})`);
        console.log(`     Premium:  ${product.deliveryTimeOptions.premium?.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.premium?.days || 'N/A'} days, MWK ${product.deliveryTimeOptions.premium?.price || 0})`);
      } else {
        console.log(`   Delivery Options: ❌ Missing`);
      }
    });

    // Test what happens in the frontend
    console.log('\n🧪 Frontend Test Scenarios:');
    console.log('='.repeat(50));
    
    const testProduct = allProducts[0];
    if (testProduct) {
      console.log(`\nTesting with product: ${testProduct.name}`);
      console.log(`Customizable: ${testProduct.customizable}`);
      
      if (testProduct.deliveryTimeOptions) {
        console.log('✅ Product has delivery options configured');
        
        // Simulate what the frontend dropdown would show
        const enabledOptions = [];
        if (testProduct.deliveryTimeOptions.standard?.enabled) {
          enabledOptions.push(`Standard (${testProduct.deliveryTimeOptions.standard.days} days) - MWK ${testProduct.deliveryTimeOptions.standard.price}`);
        }
        if (testProduct.deliveryTimeOptions.express?.enabled) {
          enabledOptions.push(`Express (${testProduct.deliveryTimeOptions.express.days} days) - MWK ${testProduct.deliveryTimeOptions.express.price}`);
        }
        if (testProduct.deliveryTimeOptions.premium?.enabled) {
          enabledOptions.push(`Premium (${testProduct.deliveryTimeOptions.premium.days} days) - MWK ${testProduct.deliveryTimeOptions.premium.price}`);
        }
        
        console.log(`📋 Dropdown would show ${enabledOptions.length} options:`);
        enabledOptions.forEach((option, i) => {
          console.log(`   ${i + 1}. ${option}`);
        });
        
        if (enabledOptions.length === 0) {
          console.log('⚠️  No enabled delivery options - dropdown would be empty!');
        }
      } else {
        console.log('❌ Product missing delivery options - would use fallback');
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the check
checkDeliveryOptions();