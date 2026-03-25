import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple User schema (without importing the full model)
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

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_connect_db', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@fashionconnect.mw' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists!');
      console.log('📧 Email: admin@fashionconnect.mw');
      console.log('🔑 Try password: admin123');
      return;
    }

    // Create admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@fashionconnect.mw',
      password: 'admin123',
      role: 'ADMIN',
      status: 'ACTIVE',
      verified: true,
      permissions: ['user_management', 'content_moderation', 'analytics', 'reports']
    });

    await admin.save();
    
    console.log('🎉 Admin created successfully!');
    console.log('📧 Email: admin@fashionconnect.mw');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');

  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Admin already exists!');
      console.log('📧 Email: admin@fashionconnect.mw');
      console.log('🔑 Try password: admin123');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createAdmin();
