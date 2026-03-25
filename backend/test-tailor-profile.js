import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/db.js';
import { User } from './src/models/user.model.js';

// Connect to database
connectDB().then(async () => {
  try {
    // Find a tailor user
    const tailor = await User.findOne({ role: 'TAILOR' });
    
    if (tailor) {
      console.log('Tailor found:');
      console.log('ID:', tailor._id);
      console.log('Name:', tailor.name);
      console.log('Email:', tailor.email);
      console.log('Profile Image:', tailor.profileImage);
      console.log('Specialties:', tailor.specialties);
      console.log('All fields:', Object.keys(tailor.toObject()));
    } else {
      console.log('No tailor found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});