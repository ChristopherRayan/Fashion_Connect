import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Test function to check profile image field
const testProfileImage = async () => {
  await connectDB();
  
  try {
    // Find a tailor user
    const user = await User.findOne({ role: 'TAILOR' });
    if (user) {
      console.log('Found user:', {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        hasProfileImage: !!user.profileImage
      });
      
      // Check the schema to see if profileImage field exists
      console.log('ProfileImage field in schema:', user.schema.paths.profileImage);
    } else {
      console.log('No tailor user found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

testProfileImage();