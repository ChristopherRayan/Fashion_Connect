import mongoose from 'mongoose';

// Global variable to track database connection status
let isConnected = false;

const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    console.log('🔍 Attempting to connect to MongoDB...');
    const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log(`\n ✅ MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    isConnected = true;
    return connectionInstance;
  } catch (error) {
    console.error("MONGODB connection FAILED ", error);
    console.log("⚠️  Starting server without database connection...");
    console.log("📝 Note: API endpoints will return mock data until database is connected");
    isConnected = false;
    throw error; // Re-throw to be caught by server.js
  }
};

// Function to check if database is connected
export const isDatabaseConnected = () => {
  return isConnected;
};

export default connectDB;