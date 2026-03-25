import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const testDocumentUpload = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find a designer user to test with
    const designer = await User.findOne({ role: 'DESIGNER' });
    
    if (!designer) {
      console.log('❌ No designer found');
      return;
    }

    console.log('👤 Testing with designer:', designer.name);
    console.log('📧 Email:', designer.email);
    console.log('📄 Current documents:', JSON.stringify(designer.documents, null, 2));
    
    // Simulate document upload
    const testDocuments = {
      nationalId: '/uploads/profiles/test-national-id.jpg',
      businessRegistration: '/uploads/profiles/test-business-cert.pdf'
    };

    const updatedUser = await User.findByIdAndUpdate(
      designer._id,
      {
        documents: { ...designer.documents, ...testDocuments },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log('✅ Documents updated successfully!');
    console.log('📄 New documents:', JSON.stringify(updatedUser.documents, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

testDocumentUpload();
