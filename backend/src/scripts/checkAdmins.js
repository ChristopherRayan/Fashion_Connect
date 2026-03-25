import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

const checkAdminUsers = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'ADMIN' }).select('name email role status verified createdAt');
    
    console.log('\n📊 Admin Users in Database:');
    console.log('='.repeat(50));
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin User:`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👤 Name: ${admin.name}`);
        console.log(`   🔑 Role: ${admin.role}`);
        console.log(`   ✅ Status: ${admin.status}`);
        console.log(`   📅 Created: ${admin.createdAt}`);
        console.log(`   🔐 Verified: ${admin.verified}`);
      });
    }
    
    // Also check all users to see what's available
    const allUsers = await User.find({}).select('name email role status');
    console.log(`\n📈 Total Users in Database: ${allUsers.length}`);
    console.log('\n👥 All Users by Role:');
    
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

checkAdminUsers();
