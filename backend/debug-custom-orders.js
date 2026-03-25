import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import { CustomOrder } from './src/models/customOrder.model.js';
import { User } from './src/models/user.model.js';

async function debugCustomOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the designer user
    const designer = await User.findOne({ 
      email: 'christopherrayankuchawo@gmail.com',
      role: 'DESIGNER'
    });
    
    if (designer) {
      console.log('🎨 Designer found:');
      console.log('   ID:', designer._id.toString());
      console.log('   Name:', designer.name);
      console.log('   Email:', designer.email);
      console.log('   Role:', designer.role);
    } else {
      console.log('❌ Designer not found');
      return;
    }

    // Get all custom orders
    const allCustomOrders = await CustomOrder.find({});
    console.log('\n📦 All Custom Orders in Database:', allCustomOrders.length);
    
    allCustomOrders.forEach((order, index) => {
      console.log(`\n   Order ${index + 1}:`);
      console.log('     ID:', order._id.toString());
      console.log('     User:', order.user.toString());
      console.log('     Designer:', order.designer.toString());
      console.log('     Product Type:', order.productType);
      console.log('     Status:', order.status);
      console.log('     Created:', order.createdAt);
    });

    // Get custom orders specifically for this designer
    const designerOrders = await CustomOrder.find({ designer: designer._id });
    console.log(`\n🔍 Custom Orders for Designer ${designer._id}:`, designerOrders.length);
    
    designerOrders.forEach((order, index) => {
      console.log(`\n   Order ${index + 1}:`);
      console.log('     ID:', order._id.toString());
      console.log('     User:', order.user.toString());
      console.log('     Designer:', order.designer.toString());
      console.log('     Product Type:', order.productType);
      console.log('     Status:', order.status);
      console.log('     Created:', order.createdAt);
    });

    // Try different query formats
    console.log('\n🔬 Testing different query formats:');
    
    // Query with string ID
    const stringQuery = await CustomOrder.find({ designer: designer._id.toString() });
    console.log('   String ID query results:', stringQuery.length);
    
    // Query with ObjectId
    const objectIdQuery = await CustomOrder.find({ designer: new mongoose.Types.ObjectId(designer._id) });
    console.log('   ObjectId query results:', objectIdQuery.length);

    // Test paginate method (same as used in the API)
    console.log('\n📋 Testing paginate method:');
    const paginateResults = await CustomOrder.paginate(
      { designer: designer._id },
      {
        page: 1,
        limit: 10,
        sort: { createdAt: -1 },
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'assignedTailor', select: 'name email phone' },
          { path: 'productReference.productId', select: 'name images price' }
        ]
      }
    );
    
    console.log('   Paginate results:');
    console.log('     Total docs:', paginateResults.totalDocs);
    console.log('     Docs found:', paginateResults.docs.length);
    console.log('     Page:', paginateResults.page);
    console.log('     Total pages:', paginateResults.totalPages);

  } catch (error) {
    console.error('Error debugging custom orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugCustomOrders();