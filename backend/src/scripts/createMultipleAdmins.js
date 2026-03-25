import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CLIENT', 'DESIGNER', 'ADMIN'], default: 'CLIENT' },
  status: { type: String, enum: ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'], default: 'ACTIVE' },
  verified: { type: Boolean, default: false },
  permissions: [{ type: String }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Add password comparison method
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

const createAdmins = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Admin accounts to create
    const adminAccounts = [
      {
        name: 'Admin User',
        email: 'admin@fashionconnect.mw',
        password: 'admin123',
        role: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        permissions: ['user_management', 'content_moderation', 'analytics', 'reports', 'order_management']
      },
      {
        name: 'Admin Example',
        email: 'admin@example.com',
        password: 'password',
        role: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        permissions: ['user_management', 'content_moderation', 'analytics', 'reports', 'order_management']
      },
      {
        name: 'Super Admin',
        email: 'superadmin@fashionconnect.mw',
        password: 'superadmin123',
        role: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        permissions: ['user_management', 'content_moderation', 'analytics', 'reports', 'order_management', 'system_admin']
      }
    ];

    console.log('\n🎯 Creating admin accounts...');
    
    for (const adminData of adminAccounts) {
      try {
        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        
        if (existingAdmin) {
          console.log(`✅ Admin already exists: ${adminData.email}`);
          
          // Test password
          const isPasswordCorrect = await existingAdmin.isPasswordCorrect(adminData.password);
          if (isPasswordCorrect) {
            console.log(`   🔑 Password verified: ${adminData.password}`);
          } else {
            console.log(`   ⚠️  Password might be different for: ${adminData.email}`);
            // Update password to ensure it works
            existingAdmin.password = adminData.password;
            await existingAdmin.save();
            console.log(`   🔄 Password updated to: ${adminData.password}`);
          }
        } else {
          // Create new admin
          const admin = new User(adminData);
          await admin.save();
          console.log(`🎉 Created new admin: ${adminData.email}`);
          console.log(`   🔑 Password: ${adminData.password}`);
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`✅ Admin already exists: ${adminData.email}`);
        } else {
          console.error(`❌ Error with ${adminData.email}:`, error.message);
        }
      }
    }

    // List all admin accounts
    console.log('\n📊 Final Admin Accounts:');
    console.log('='.repeat(50));
    
    const allAdmins = await User.find({ role: 'ADMIN' }).select('name email role status verified');
    
    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Try passwords: admin123, password, superadmin123`);
      console.log(`   ✅ Status: ${admin.status}`);
      console.log(`   🔐 Verified: ${admin.verified}`);
    });

    console.log('\n🎯 LOGIN INSTRUCTIONS:');
    console.log('='.repeat(50));
    console.log('Go to: http://localhost:5173/login');
    console.log('\nTry these admin credentials:');
    console.log('1. Email: admin@fashionconnect.mw | Password: admin123');
    console.log('2. Email: admin@example.com | Password: password');
    console.log('3. Email: superadmin@fashionconnect.mw | Password: superadmin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

createAdmins();
