import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const addTestDocuments = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find the user we created earlier
    const user = await User.findOne({ email: 'crkuchawo@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Role:', user.role);
    console.log('📄 Current documents:', JSON.stringify(user.documents, null, 2));
    
    // Add test documents
    const testDocuments = {
      nationalId: '/uploads/profiles/national-id-sample.jpg',
      businessRegistration: '/uploads/profiles/business-cert-sample.pdf',
      taxCertificate: '/uploads/profiles/tax-cert-sample.pdf',
      portfolio: '/uploads/profiles/portfolio-sample.jpg'
    };

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        documents: { ...user.documents, ...testDocuments },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    console.log('✅ Test documents added successfully!');
    console.log('📄 Updated documents:', JSON.stringify(updatedUser.documents, null, 2));
    
    console.log('\n🎉 You can now view these documents in the admin panel!');
    console.log('📋 Documents added:');
    Object.entries(testDocuments).forEach(([key, value]) => {
      console.log(`  📄 ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

addTestDocuments();
