import mongoose from 'mongoose';
import { Product } from '../src/models/product.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const updateDeliveryOptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all products that don't have price field in delivery options
    const products = await Product.find({
      $or: [
        { 'deliveryTimeOptions.standard.price': { $exists: false } },
        { 'deliveryTimeOptions.express.price': { $exists: false } },
        { 'deliveryTimeOptions.premium.price': { $exists: false } }
      ]
    });

    console.log(`Found ${products.length} products to update`);

    for (const product of products) {
      const updateData = {};

      // Add price field to delivery options if missing
      if (!product.deliveryTimeOptions?.standard?.price && product.deliveryTimeOptions?.standard) {
        updateData['deliveryTimeOptions.standard.price'] = 0;
      }
      if (!product.deliveryTimeOptions?.express?.price && product.deliveryTimeOptions?.express) {
        updateData['deliveryTimeOptions.express.price'] = 0;
      }
      if (!product.deliveryTimeOptions?.premium?.price && product.deliveryTimeOptions?.premium) {
        updateData['deliveryTimeOptions.premium.price'] = 0;
      }

      if (Object.keys(updateData).length > 0) {
        await Product.findByIdAndUpdate(product._id, { $set: updateData });
        console.log(`Updated product: ${product.name}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
updateDeliveryOptions();
