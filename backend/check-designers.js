import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import { EmailVerification } from './src/models/emailVerification.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDesigners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all designers
    const designers = await User.find({ role: 'DESIGNER' }).select('name email businessName');
    console.log(`📊 Found ${designers.length} designers:`);
    
    designers.forEach((designer, index) => {
      console.log(`${index + 1}. ${designer.name} (${designer.email})`);
      console.log(`   Business: ${designer.businessName || 'N/A'}`);
      console.log(`   ID: ${designer._id}`);
      console.log('');
    });

    // Now let's fix the invitation with a real designer ID
    const targetToken = 'd4af08950fcb29f27aa5551a8fab54379fba8b362a9f54fabe47a434fab778d2';
    const targetRecord = await EmailVerification.findOne({ token: targetToken });
    
    if (targetRecord && designers.length > 0) {
      const firstDesigner = designers[0];
      console.log(`🔧 Updating invitation to use designer: ${firstDesigner.name}`);
      
      // Update the record to be a tailor invitation
      targetRecord.type = 'TAILOR_INVITATION';
      targetRecord.metadata = {
        designerId: firstDesigner._id,
        designerName: firstDesigner.name,
        designerBusinessName: firstDesigner.businessName || firstDesigner.name,
        invitedTailorName: 'Manzy Tailor',
        invitedTailorPhone: '+265123456789'
      };
      
      await targetRecord.save();
      console.log('✅ Updated invitation record successfully');
      
    } else if (!targetRecord) {
      console.log(`❌ Target token not found in database`);
    } else {
      console.log(`❌ No designers found in database`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkDesigners();