// Test MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not set in environment variables');
      return;
    }
    
    // Try to connect with a short timeout
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Host:', connection.connection.host);
    console.log('Database:', connection.connection.name);
    
    // Test a simple query
    try {
      const collections = await connection.connection.db.listCollections().toArray();
      console.log('📋 Available collections:', collections.map(c => c.name));
    } catch (queryError) {
      console.log('⚠️  Could not list collections:', queryError.message);
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔧 Troubleshooting tips:');
    console.error('  1. Make sure MongoDB service is running');
    console.error('  2. Check if the MONGO_URI is correct:', process.env.MONGO_URI);
    console.error('  3. Verify MongoDB is accessible on localhost:27017');
  }
}

testConnection();