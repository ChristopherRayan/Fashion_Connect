import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './backend/src/models/user.model.js';

// Load environment variables
dotenv.config();

const checkProfileImage = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find the specific tailor by email
    const tailor = await User.findOne({ 
      email: 'kentailor10@gmail.com',
      role: 'TAILOR'
    }).select('name email profileImage');
    
    if (tailor) {
      console.log('📋 Tailor found:');
      console.log('   Name:', tailor.name);
      console.log('   Email:', tailor.email);
      console.log('   Profile Image:', tailor.profileImage);
      
      if (tailor.profileImage) {
        console.log('   Image URL: http://localhost:8000' + tailor.profileImage);
      }
    } else {
      console.log('❌ Tailor not found');
      
      // Find all tailors to see if there are any at all
      const allTailors = await User.find({ role: 'TAILOR' }).select('name email profileImage');
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

checkProfileImage();