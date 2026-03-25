import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDocuments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all designers
    const designers = await User.find({ role: 'DESIGNER' }).select('name email documents createdAt');
    
    console.log(`\n📊 Found ${designers.length} designers:\n`);
    
    designers.forEach((designer, index) => {
      console.log(`${index + 1}. ${designer.name} (${designer.email})`);
      console.log(`   📅 Registered: ${designer.createdAt}`);
      console.log(`   📄 Documents:`, designer.documents || 'None');
      
      if (designer.documents) {
        const docCount = Object.keys(designer.documents).filter(key => designer.documents[key]).length;
        console.log(`   📊 Document count: ${docCount}`);
      }
      console.log('');
    });

    // Check uploads directory
    console.log('📁 Checking uploads directory...');
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`   Found ${files.length} files in uploads/profiles:`);
      files.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log('   ❌ uploads/profiles directory does not exist');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkDocuments();
