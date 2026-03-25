import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';

// Load environment variables
dotenv.config();

const testProfileUpload = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find a tailor to test with
    const tailor = await User.findOne({ role: 'TAILOR' });
    
    if (!tailor) {
      console.log('❌ No tailor found');
      return;
    }
    
    console.log('👤 Testing with tailor:', tailor.name);
    console.log('📧 Email:', tailor.email);
    console.log('🖼️ Current profile image:', tailor.profileImage || 'None');
    
    // Simulate profile image upload
    const testProfileImagePath = '/uploads/profiles/tailor-profile-1234567890-123456789.jpg';
    
    console.log('📤 Simulating profile image upload...');
    console.log('📁 Test image path:', testProfileImagePath);
    
    // Update the tailor with the test profile image
    const updatedTailor = await User.findByIdAndUpdate(
      tailor._id,
      { profileImage: testProfileImagePath },
      { new: true }
    ).select('name email profileImage');
    
    console.log('✅ Profile image updated successfully!');
    console.log('🖼️ New profile image:', updatedTailor.profileImage);
    
    // Verify the update
    const verifiedTailor = await User.findById(tailor._id).select('name email profileImage');
    console.log('🔍 Verified profile image:', verifiedTailor.profileImage);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

testProfileUpload();