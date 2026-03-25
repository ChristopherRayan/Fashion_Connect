import mongoose from 'mongoose';
import { Product } from '../src/models/product.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ensureDeliveryTimeOptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all products that don't have complete delivery time options
    const products = await Product.find({
      $or: [
        { deliveryTimeOptions: { $exists: false } },
        { 'deliveryTimeOptions.standard': { $exists: false } },
        { 'deliveryTimeOptions.express': { $exists: false } },
        { 'deliveryTimeOptions.premium': { $exists: false } },
        { 'deliveryTimeOptions.standard.enabled': { $exists: false } },
        { 'deliveryTimeOptions.standard.days': { $exists: false } },
        { 'deliveryTimeOptions.standard.description': { $exists: false } },
        { 'deliveryTimeOptions.standard.price': { $exists: false } }
      ]
    });

    console.log(`Found ${products.length} products to update with delivery time options`);

    for (const product of products) {
      const updateData = {};

      // Ensure complete delivery time options structure
      if (!product.deliveryTimeOptions) {
        updateData.deliveryTimeOptions = {
          standard: {
            enabled: true,
            days: 14,
            description: 'Standard delivery',
            price: 0
          },
          express: {
            enabled: false,
            days: 7,
            description: 'Express delivery',
            price: 0
          },
          premium: {
            enabled: false,
            days: 3,
            description: 'Premium delivery',
            price: 0
          }
        };
      } else {
        // Update individual missing fields
        if (!product.deliveryTimeOptions.standard) {
          updateData['deliveryTimeOptions.standard'] = {
            enabled: true,
            days: 14,
            description: 'Standard delivery',
            price: 0
          };
        } else {
          if (product.deliveryTimeOptions.standard.enabled === undefined) {
            updateData['deliveryTimeOptions.standard.enabled'] = true;
          }
          if (!product.deliveryTimeOptions.standard.days) {
            updateData['deliveryTimeOptions.standard.days'] = 14;
          }
          if (!product.deliveryTimeOptions.standard.description) {
            updateData['deliveryTimeOptions.standard.description'] = 'Standard delivery';
          }
          if (product.deliveryTimeOptions.standard.price === undefined) {
            updateData['deliveryTimeOptions.standard.price'] = 0;
          }
        }

        if (!product.deliveryTimeOptions.express) {
          updateData['deliveryTimeOptions.express'] = {
            enabled: false,
            days: 7,
            description: 'Express delivery',
            price: 0
          };
        } else {
          if (product.deliveryTimeOptions.express.enabled === undefined) {
            updateData['deliveryTimeOptions.express.enabled'] = false;
          }
          if (!product.deliveryTimeOptions.express.days) {
            updateData['deliveryTimeOptions.express.days'] = 7;
          }
          if (!product.deliveryTimeOptions.express.description) {
            updateData['deliveryTimeOptions.express.description'] = 'Express delivery';
          }
          if (product.deliveryTimeOptions.express.price === undefined) {
            updateData['deliveryTimeOptions.express.price'] = 0;
          }
        }

        if (!product.deliveryTimeOptions.premium) {
          updateData['deliveryTimeOptions.premium'] = {
            enabled: false,
            days: 3,
            description: 'Premium delivery',
            price: 0
          };
        } else {
          if (product.deliveryTimeOptions.premium.enabled === undefined) {
            updateData['deliveryTimeOptions.premium.enabled'] = false;
          }
          if (!product.deliveryTimeOptions.premium.days) {
            updateData['deliveryTimeOptions.premium.days'] = 3;
          }
          if (!product.deliveryTimeOptions.premium.description) {
            updateData['deliveryTimeOptions.premium.description'] = 'Premium delivery';
          }
          if (product.deliveryTimeOptions.premium.price === undefined) {
            updateData['deliveryTimeOptions.premium.price'] = 0;
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        await Product.findByIdAndUpdate(product._id, { $set: updateData });
        console.log(`✅ Updated product: ${product.name}`);
        console.log(`   - Delivery options configured`);
      }
    }

    // Verify the update
    const updatedProducts = await Product.find({
      customizable: true,
      'deliveryTimeOptions.standard.enabled': true
    }).select('name deliveryTimeOptions');

    console.log('\n📊 Summary of customizable products with delivery options:');
    console.log('='.repeat(70));
    updatedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Standard: ${product.deliveryTimeOptions.standard.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.standard.days} days, MWK ${product.deliveryTimeOptions.standard.price})`);
      console.log(`   Express:  ${product.deliveryTimeOptions.express.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.express.days} days, MWK ${product.deliveryTimeOptions.express.price})`);
      console.log(`   Premium:  ${product.deliveryTimeOptions.premium.enabled ? '✅' : '❌'} (${product.deliveryTimeOptions.premium.days} days, MWK ${product.deliveryTimeOptions.premium.price})`);
    });

    console.log('\n🎯 Migration completed successfully');
    console.log(`✅ ${products.length} products updated`);
    console.log(`📦 ${updatedProducts.length} customizable products now have delivery options`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
ensureDeliveryTimeOptions();