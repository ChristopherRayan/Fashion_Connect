import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

// Load environment variables
dotenv.config();

const createUser = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'christopherrayankuchawo@gmail.com' });
    
    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email);
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', existingUser.name);
      console.log('🔑 Role:', existingUser.role);
      console.log('📊 Status:', existingUser.status);
      return;
    }

    // Create new user
    const userData = {
      name: 'Christopher Rayanku Chawo',
      email: 'christopherrayankuchawo@gmail.com',
      password: 'dddddd', // This will be hashed automatically by the pre-save middleware
      role: 'CLIENT',
      status: 'ACTIVE',
      verified: true,
      phone: '+265 99 123 4567'
    };

    console.log('👤 Creating user with data:', {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.status
    });

    const user = await User.create(userData);
    
    console.log('✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);
    console.log('📊 Status:', user.status);
    console.log('🆔 User ID:', user._id);
    
    console.log('\n🎉 You can now login with:');
    console.log('📧 Email: christopherrayankuchawo@gmail.com');
    console.log('🔐 Password: dddddd');
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  User with this email already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

createUser();
