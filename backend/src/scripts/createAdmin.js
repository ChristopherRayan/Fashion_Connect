import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@fashionconnect.mw' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('📧 Email: admin@fashionconnect.mw');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: ADMIN');
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@fashionconnect.mw',
      password: 'admin123', // This will be hashed automatically by the pre-save hook
      role: 'ADMIN',
      status: 'ACTIVE',
      verified: true,
      permissions: [
        'user_management',
        'content_moderation', 
        'dispute_resolution',
        'analytics',
        'settings',
        'reports',
        'order_management',
        'designer_verification'
      ]
    };

    const admin = await User.create(adminData);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@fashionconnect.mw');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    console.log('🆔 ID:', admin._id);
    
    // Also create a backup admin
    const backupAdminExists = await User.findOne({ email: 'superadmin@fashionconnect.mw' });
    
    if (!backupAdminExists) {
      const backupAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@fashionconnect.mw',
        password: 'superadmin123',
        role: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        permissions: [
          'user_management',
          'content_moderation', 
          'dispute_resolution',
          'analytics',
          'settings',
          'reports',
          'order_management',
          'designer_verification',
          'system_admin'
        ]
      });
      
      console.log('✅ Backup admin user created!');
      console.log('📧 Email: superadmin@fashionconnect.mw');
      console.log('🔑 Password: superadmin123');
      console.log('🆔 ID:', backupAdmin._id);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
createAdminUser();
