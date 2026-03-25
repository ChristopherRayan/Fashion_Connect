// Simple script to test MongoDB connection
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testMongo() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not set in environment variables');
      return;
    }
    
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Host:', connection.connection.host);
    console.log('Database:', connection.connection.name);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testMongo();