import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import { CustomOrder } from '../src/models/customOrder.model.js';
import { Product } from '../src/models/product.model.js';

dotenv.config({ path: '../.env' });

const updateCustomOrdersWithProductReference = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('📋 Fetching all custom orders without productReference...');
    const customOrders = await CustomOrder.find({
      $or: [
        { productReference: { $exists: false } },
        { productReference: null },
        { 'productReference.productId': { $exists: false } }
      ]
    });
    
    console.log(`Found ${customOrders.length} custom orders without productReference`);
    
    console.log('🏷️ Fetching available products...');
    const products = await Product.find({}).limit(10);
    console.log(`Found ${products.length} products in database`);
    
    if (products.length === 0) {
      console.log('❌ No products found in database. Please seed products first.');
      return;
    }
    
    let updatedCount = 0;
    
    for (const order of customOrders) {
      try {
        // Find a product that matches the productType or just use a random one
        let matchingProduct = products.find(p => 
          p.name.toLowerCase().includes(order.productType.toLowerCase()) ||
          order.productType.toLowerCase().includes(p.name.toLowerCase())
        );
        
        // If no matching product found, use the first available product
        if (!matchingProduct) {
          matchingProduct = products[Math.floor(Math.random() * products.length)];
        }
        
        const productReference = {
          productId: matchingProduct._id,
          productName: matchingProduct.name,
          productImage: matchingProduct.images && matchingProduct.images.length > 0 
            ? matchingProduct.images[0] 
            : null
        };
        
        await CustomOrder.findByIdAndUpdate(order._id, {
          productReference: productReference
        });
        
        console.log(`✅ Updated order ${order._id} with product ${matchingProduct.name}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to update order ${order._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} custom orders with productReference data`);
    
    // Verify the update
    console.log('🔍 Verifying updates...');
    const updatedOrders = await CustomOrder.find({
      'productReference.productId': { $exists: true }
    }).populate('productReference.productId', 'name images price');
    
    console.log(`✅ Verification: ${updatedOrders.length} orders now have productReference data`);
    
    if (updatedOrders.length > 0) {
      console.log('Sample updated order:');
      const sample = updatedOrders[0];
      console.log({
        orderId: sample._id,
        productType: sample.productType,
        productReference: {
          productId: sample.productReference.productId._id,
          productName: sample.productReference.productName,
          productImage: sample.productReference.productImage,
          populatedProductName: sample.productReference.productId.name
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating custom orders:', error);
  } finally {
    process.exit(0);
  }
};

updateCustomOrdersWithProductReference();