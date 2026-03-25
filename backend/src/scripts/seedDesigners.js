import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';

const seedDesigners = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionconnect');
    console.log('Connected to MongoDB');

    // Check if designers already exist
    const existingDesigners = await User.countDocuments({ role: 'DESIGNER' });
    console.log(`Found ${existingDesigners} existing designers`);

    if (existingDesigners > 0) {
      console.log('Designers already exist. Skipping seed.');
      return;
    }

    // Create sample designers
    const designersData = [
      {
        name: 'Thoko Banda',
        email: 'thoko.banda@fashionconnect.mw',
        password: await bcrypt.hash('password123', 10),
        role: 'DESIGNER',
        status: 'ACTIVE',
        verified: true,
        businessName: 'Thoko Designs',
        bio: 'Specializing in traditional Malawian fashion with modern twists',
        specialty: 'Traditional Wear',
        location: 'Lilongwe',
        customOrdersAvailable: true,
        turnaroundTime: '2-3 weeks'
      },
      {
        name: 'Grace Mwale',
        email: 'grace.mwale@fashionconnect.mw',
        password: await bcrypt.hash('password123', 10),
        role: 'DESIGNER',
        status: 'ACTIVE',
        verified: true,
        businessName: 'Grace Fashion House',
        bio: 'Contemporary African fashion for the modern woman',
        specialty: 'Contemporary Wear',
        location: 'Blantyre',
        customOrdersAvailable: true,
        turnaroundTime: '1-2 weeks'
      },
      {
        name: 'James Phiri',
        email: 'james.phiri@fashionconnect.mw',
        password: await bcrypt.hash('password123', 10),
        role: 'DESIGNER',
        status: 'ACTIVE',
        verified: true,
        businessName: 'Phiri Couture',
        bio: 'High-end formal wear and wedding dresses',
        specialty: 'Formal Wear',
        location: 'Mzuzu',
        customOrdersAvailable: true,
        turnaroundTime: '3-4 weeks'
      },
      {
        name: 'Mary Chirwa',
        email: 'mary.chirwa@fashionconnect.mw',
        password: await bcrypt.hash('password123', 10),
        role: 'DESIGNER',
        status: 'ACTIVE',
        verified: true,
        businessName: 'Chirwa Textiles',
        bio: 'Sustainable fashion using locally sourced materials',
        specialty: 'Sustainable Fashion',
        location: 'Zomba',
        customOrdersAvailable: true,
        turnaroundTime: '2-4 weeks'
      },
      {
        name: 'Peter Kachingwe',
        email: 'peter.kachingwe@fashionconnect.mw',
        password: await bcrypt.hash('password123', 10),
        role: 'DESIGNER',
        status: 'ACTIVE',
        verified: true,
        businessName: 'Kachingwe Menswear',
        bio: 'Premium menswear and accessories',
        specialty: 'Menswear',
        location: 'Lilongwe',
        customOrdersAvailable: true,
        turnaroundTime: '1-3 weeks'
      }
    ];

    // Insert designers
    const createdDesigners = await User.insertMany(designersData);
    console.log(`Created ${createdDesigners.length} designers successfully`);

    // Display created designers
    createdDesigners.forEach(designer => {
      console.log(`- ${designer.name} (${designer.businessName}) - ${designer.specialty}`);
    });

  } catch (error) {
    console.error('Error seeding designers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedDesigners();
