import mongoose from 'mongoose';
import { Product } from '../src/models/product.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const enableMoreDeliveryOptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all customizable products
    const customizableProducts = await Product.find({ customizable: true });
    console.log(`Found ${customizableProducts.length} customizable products to update`);

    for (const product of customizableProducts) {
      // Enable more delivery options with realistic pricing
      const updateData = {
        'deliveryTimeOptions.standard.enabled': true,
        'deliveryTimeOptions.standard.days': 14,
        'deliveryTimeOptions.standard.description': 'Standard custom order delivery',
        'deliveryTimeOptions.standard.price': 0,
        
        'deliveryTimeOptions.express.enabled': true,
        'deliveryTimeOptions.express.days': 7,
        'deliveryTimeOptions.express.description': 'Express custom order delivery',
        'deliveryTimeOptions.express.price': 2000, // MWK 2,000 for express
        
        'deliveryTimeOptions.premium.enabled': true,
        'deliveryTimeOptions.premium.days': 3,
        'deliveryTimeOptions.premium.description': 'Premium rush custom order delivery',
        'deliveryTimeOptions.premium.price': 5000 // MWK 5,000 for premium rush
      };

      await Product.findByIdAndUpdate(product._id, { $set: updateData });
      console.log(`✅ Updated delivery options for: ${product.name}`);
    }

    // Verify the updates
    const updatedProducts = await Product.find({ customizable: true }).select('name deliveryTimeOptions');
    
    console.log('\n📊 Updated Customizable Products with Enhanced Delivery Options:');
    console.log('='.repeat(80));
    
    updatedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Standard: ✅ ${product.deliveryTimeOptions.standard.days} days - MWK ${product.deliveryTimeOptions.standard.price}`);
      console.log(`   Express:  ✅ ${product.deliveryTimeOptions.express.days} days - MWK ${product.deliveryTimeOptions.express.price}`);
      console.log(`   Premium:  ✅ ${product.deliveryTimeOptions.premium.days} days - MWK ${product.deliveryTimeOptions.premium.price}`);
    });

    console.log('\n🎯 Enhancement completed successfully');
    console.log(`✅ ${customizableProducts.length} customizable products now have multiple delivery options`);
    console.log('📋 Customers can now choose from 3 delivery timeframes with different pricing');
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the enhancement
enableMoreDeliveryOptions();