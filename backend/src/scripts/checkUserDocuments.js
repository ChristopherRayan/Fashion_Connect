import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const checkUserDocuments = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find the specific user
    const user = await User.findOne({ email: 'crkuchawo@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Role:', user.role);
    console.log('📊 Status:', user.status);
    console.log('📄 Documents:', JSON.stringify(user.documents, null, 2));
    
    // Check if documents exist
    if (user.documents && Object.keys(user.documents).length > 0) {
      console.log('\n📋 Document Details:');
      Object.entries(user.documents).forEach(([key, value]) => {
        if (value) {
          console.log(`  ${key}: ${value}`);
        }
      });
    } else {
      console.log('\n⚠️  No documents found for this user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

checkUserDocuments();
