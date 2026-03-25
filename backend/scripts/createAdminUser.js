import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminCredentials = {
      email: 'admin@fashionconnect.mw',
      password: 'password123',
      name: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
      verified: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      permissions: [
        'manage_users',
        'manage_products', 
        'manage_orders',
        'view_analytics',
        'manage_complaints',
        'system_settings'
      ]
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      email: adminCredentials.email 
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user with email ${adminCredentials.email} already exists`);
      console.log(`📋 Current admin details:`);
      console.log(`   - Name: ${existingAdmin.name}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      console.log(`   - Status: ${existingAdmin.status}`);
      console.log(`   - Verified: ${existingAdmin.verified}`);
      console.log(`   - Created: ${existingAdmin.createdAt}`);
      
      // Update password if needed
      if (existingAdmin.role !== 'ADMIN') {
        await User.findByIdAndUpdate(existingAdmin._id, {
          role: 'ADMIN',
          permissions: adminCredentials.permissions,
          verified: true,
          emailVerified: true,
          status: 'ACTIVE'
        });
        console.log('✅ Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const adminUser = new User(adminCredentials);
      await adminUser.save();
      
      console.log('🎉 Admin user created successfully!');
      console.log('📋 Admin user details:');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Status: ${adminUser.status}`);
      console.log(`   - Verified: ${adminUser.verified}`);
      console.log(`   - Permissions: ${adminUser.permissions.join(', ')}`);
    }

    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${adminCredentials.email}`);
    console.log(`   Password: ${adminCredentials.password}`);
    console.log('\n💡 You can now log in to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.log('💡 This error usually means the email already exists in the database.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();