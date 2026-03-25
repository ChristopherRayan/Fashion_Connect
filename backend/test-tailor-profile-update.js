import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';

// Load environment variables
dotenv.config();

const testTailorProfileUpdate = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Find a tailor to test with
    const tailor = await User.findOne({ role: 'TAILOR' }).select('_id name email profileImage');
    if (!tailor) {
      console.log('❌ No tailor found for testing');
      return;
    }

    console.log('👤 Testing with tailor:', tailor.name, '(' + tailor.email + ')');
    console.log('🖼️ Current profile image:', tailor.profileImage);

    // Test updating profile without changing image
    const updateData = {
      name: tailor.name + ' (Updated)',
      bio: 'Test bio for profile update'
    };

    const updatedTailor = await User.findByIdAndUpdate(
      tailor._id,
      updateData,
      { new: true, runValidators: true }
    ).select('name email profileImage bio');

    console.log('✅ Profile updated successfully');
    console.log('📋 Updated data:', {
      name: updatedTailor.name,
      email: updatedTailor.email,
      profileImage: updatedTailor.profileImage,
      bio: updatedTailor.bio
    });

    // Verify image is still there
    if (updatedTailor.profileImage === tailor.profileImage) {
      console.log('✅ Profile image preserved during update');
    } else {
      console.log('⚠️ Profile image changed during update:', updatedTailor.profileImage);
    }

    // Test setting profile image to null (removal)
    const removeImageUpdate = {
      profileImage: null
    };

    const tailorWithoutImage = await User.findByIdAndUpdate(
      tailor._id,
      removeImageUpdate,
      { new: true, runValidators: true }
    ).select('name email profileImage bio');

    console.log('🗑️ Profile image removed');
    console.log('📋 Data after image removal:', {
      name: tailorWithoutImage.name,
      profileImage: tailorWithoutImage.profileImage
    });

    // Restore original data
    await User.findByIdAndUpdate(tailor._id, {
      name: tailor.name,
      profileImage: tailor.profileImage,
      bio: null
    });

    console.log('🔄 Test data restored');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

testTailorProfileUpdate();