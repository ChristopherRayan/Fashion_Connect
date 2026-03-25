import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGO_URI:', process.env.MONGO_URI);

async function checkTailorImages() {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in environment variables');
      return;
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Count total tailors
    const totalTailors = await User.countDocuments({ role: 'TAILOR' });
    console.log(`Total tailors: ${totalTailors}`);
    
    // Find all tailors (with or without profile images)
    const tailors = await User.find({ role: 'TAILOR' })
      .select('name email profileImage')
      .limit(10);
    
    console.log('All tailors:');
    tailors.forEach(tailor => {
      console.log(`- ${tailor.name} (${tailor.email}): ${tailor.profileImage || 'No profile image'}`);
    });
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTailorImages();