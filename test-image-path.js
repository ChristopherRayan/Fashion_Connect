import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './backend/src/models/user.model.js';

// Load environment variables
dotenv.config();

const testImagePath = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find all tailors with profile images
    const tailorsWithImages = await User.find({ 
      role: 'TAILOR',
      profileImage: { $exists: true, $ne: null }
    }).select('name email profileImage');
    
    console.log(`📊 Found ${tailorsWithImages.length} tailors with profile images:`);
    
    tailorsWithImages.forEach((tailor, index) => {
      console.log(`${index + 1}. ${tailor.name} (${tailor.email})`);
      console.log(`   Profile Image: ${tailor.profileImage}`);
      console.log(`   Image URL: http://localhost:8000${tailor.profileImage}`);
      console.log('');
    });
    
    if (tailorsWithImages.length === 0) {
      console.log('⚠️ No tailors with profile images found');
      
      // Find all tailors to see if there are any at all
      const allTailors = await User.find({ role: 'TAILOR' });
      console.log(`📊 Total tailors in database: ${allTailors.length}`);
      
      allTailors.forEach((tailor, index) => {
        console.log(`${index + 1}. ${tailor.name} (${tailor.email}) - Profile Image: ${tailor.profileImage || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

testImagePath();