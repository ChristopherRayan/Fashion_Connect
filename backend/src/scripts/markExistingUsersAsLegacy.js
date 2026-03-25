import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Simple User schema for migration
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String,
  verified: Boolean,
  emailVerified: Boolean,
  emailVerifiedAt: Date,
  lastLogin: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const markExistingUsersAsLegacy = async () => {
  try {
    console.log('🚀 Starting migration: Mark existing users as legacy...');
    
    // Find all users who don't have emailVerified field set
    const existingUsers = await User.find({
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: null }
      ]
    });

    console.log(`📊 Found ${existingUsers.length} existing users to update`);

    if (existingUsers.length === 0) {
      console.log('✅ No users need migration');
      return;
    }

    // Update all existing users to not require email verification
    const result = await User.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: null }
        ]
      },
      {
        $set: {
          emailVerified: true, // Mark as verified so they can login
          emailVerifiedAt: new Date(), // Set verification date to now
        }
      }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Updated ${result.modifiedCount} users`);
    console.log('');
    console.log('🎯 Summary:');
    console.log(`   • Existing users: Can login normally (marked as email verified)`);
    console.log(`   • New users: Must verify email before registration`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const runMigration = async () => {
  try {
    await connectDB();
    await markExistingUsersAsLegacy();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
runMigration();
