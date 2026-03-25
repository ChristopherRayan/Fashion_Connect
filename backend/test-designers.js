import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';

dotenv.config();

const testDesigners = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    console.log('🔍 Searching for designers...');
    const designers = await User.find({ role: 'DESIGNER' });
    console.log(`📊 Found ${designers.length} designers:`);
    
    designers.forEach((designer, index) => {
      console.log(`${index + 1}. ${designer.name} (${designer.email}) - Status: ${designer.status}`);
    });

    if (designers.length === 0) {
      console.log('⚠️ No designers found in database');
      console.log('💡 Creating a sample designer...');
      
      const sampleDesigner = new User({
        name: 'Sample Designer',
        email: 'designer@example.com',
        password: 'password123',
        role: 'DESIGNER',
        status: 'ACTIVE',
        bio: 'A talented fashion designer',
        specialty: 'Custom Clothing',
        location: 'Lilongwe, Malawi'
      });

      await sampleDesigner.save();
      console.log('✅ Sample designer created');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

testDesigners();
