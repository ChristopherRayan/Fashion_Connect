import mongoose from 'mongoose';
import { EmailVerification } from './src/models/emailVerification.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixInvitations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all email verification records
    const allRecords = await EmailVerification.find({});
    console.log(`📊 Found ${allRecords.length} email verification records`);

    // Check for records missing required fields
    const recordsToFix = allRecords.filter(record => 
      !record.type || record.isUsed === undefined || !record.metadata
    );

    console.log(`🔧 Found ${recordsToFix.length} records that need fixing`);

    if (recordsToFix.length > 0) {
      console.log('\n📋 Records to fix:');
      recordsToFix.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}`);
        console.log(`   Token: ${record.token.substring(0, 20)}...`);
        console.log(`   Missing type: ${!record.type}`);
        console.log(`   Missing isUsed: ${record.isUsed === undefined}`);
        console.log(`   Missing metadata: ${!record.metadata}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log(`   Expires: ${record.expiresAt}`);
        console.log('');
      });

      // Ask user what to do
      console.log('🤔 What would you like to do?');
      console.log('1. Delete all existing records (recommended for fresh start)');
      console.log('2. Update existing records to add missing fields');
      console.log('3. Just show the records (no changes)');
    }

    // For now, let's check if there's a specific token we're looking for
    const targetToken = 'd4af08950fcb29f27aa5551a8fab54379fba8b362a9f54fabe47a434fab778d2';
    const targetRecord = await EmailVerification.findOne({ token: targetToken });
    
    if (targetRecord) {
      console.log(`🎯 Found the target token record:`);
      console.log(`   Email: ${targetRecord.email}`);
      console.log(`   Type: ${targetRecord.type || 'MISSING'}`);
      console.log(`   IsUsed: ${targetRecord.isUsed}`);
      console.log(`   Metadata: ${targetRecord.metadata ? 'Present' : 'MISSING'}`);
      console.log(`   Expires: ${targetRecord.expiresAt}`);
      console.log(`   Is Expired: ${targetRecord.expiresAt <= new Date()}`);
    } else {
      console.log(`❌ Target token not found in database`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixInvitations();