import mongoose from 'mongoose';
import { EmailVerification } from './src/models/emailVerification.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSpecificInvitation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const targetToken = 'd4af08950fcb29f27aa5551a8fab54379fba8b362a9f54fabe47a434fab778d2';
    const targetRecord = await EmailVerification.findOne({ token: targetToken });
    
    if (targetRecord) {
      console.log(`🎯 Found the target token record:`);
      console.log(`   Email: ${targetRecord.email}`);
      console.log(`   Current Type: ${targetRecord.type}`);
      console.log(`   IsUsed: ${targetRecord.isUsed}`);
      console.log(`   Current Metadata:`, targetRecord.metadata);
      
      // Update the record to be a tailor invitation
      targetRecord.type = 'TAILOR_INVITATION';
      
      // Add proper metadata if missing
      if (!targetRecord.metadata || !targetRecord.metadata.designerId) {
        targetRecord.metadata = {
          designerId: new mongoose.Types.ObjectId(), // You'll need to replace this with actual designer ID
          designerName: 'Test Designer',
          designerBusinessName: 'Test Business',
          invitedTailorName: 'Manzy Tailor',
          invitedTailorPhone: '+265123456789'
        };
      }
      
      await targetRecord.save();
      console.log('✅ Updated record successfully');
      
      // Verify the update
      const updatedRecord = await EmailVerification.findOne({ token: targetToken });
      console.log(`\n📋 Updated record:`);
      console.log(`   Type: ${updatedRecord.type}`);
      console.log(`   Metadata:`, updatedRecord.metadata);
      
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

fixSpecificInvitation();