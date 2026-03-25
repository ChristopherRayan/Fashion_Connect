import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const testRegistrationFlow = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a new designer user (simulating registration)
    const testEmail = 'test.designer@example.com';
    
    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });
    
    console.log('👤 Creating test designer...');
    const newDesigner = await User.create({
      name: 'Test Designer',
      email: testEmail,
      password: 'testpassword123',
      role: 'DESIGNER',
      status: 'PENDING_VERIFICATION',
      businessName: 'Test Fashion House',
      bio: 'Test designer for document upload testing',
      specialty: 'Custom Clothing',
      location: 'Test City'
    });

    console.log('✅ Designer created:', newDesigner.name);
    console.log('📧 Email:', newDesigner.email);
    console.log('🆔 ID:', newDesigner._id);
    console.log('📄 Initial documents:', JSON.stringify(newDesigner.documents, null, 2));

    // Test 2: Simulate document upload (what should happen after registration)
    console.log('\n📤 Simulating document upload...');
    const testDocuments = {
      nationalId: '/uploads/profiles/profile-1234567890-123456789.jpg',
      businessRegistration: '/uploads/profiles/profile-1234567890-987654321.pdf',
      taxCertificate: '/uploads/profiles/profile-1234567890-555666777.pdf',
      portfolio: '/uploads/profiles/profile-1234567890-888999000.jpg'
    };

    const updatedDesigner = await User.findByIdAndUpdate(
      newDesigner._id,
      {
        documents: { ...newDesigner.documents, ...testDocuments },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log('✅ Documents uploaded successfully!');
    console.log('📄 Updated documents:', JSON.stringify(updatedDesigner.documents, null, 2));

    // Test 3: Verify the documents can be retrieved (simulating admin view)
    console.log('\n🔍 Verifying document retrieval...');
    const retrievedDesigner = await User.findById(newDesigner._id).select('-password -refreshToken');
    
    if (retrievedDesigner.documents && Object.keys(retrievedDesigner.documents).length > 0) {
      console.log('✅ Documents successfully retrieved!');
      console.log('📋 Document count:', Object.keys(retrievedDesigner.documents).length);
      
      Object.entries(retrievedDesigner.documents).forEach(([key, value]) => {
        if (value) {
          console.log(`  📄 ${key}: ${value}`);
        }
      });
    } else {
      console.log('❌ No documents found after upload');
    }

    // Clean up test user
    await User.deleteOne({ _id: newDesigner._id });
    console.log('\n🧹 Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

testRegistrationFlow();
