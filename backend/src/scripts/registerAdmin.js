import fetch from 'node-fetch';

const registerAdmin = async () => {
  try {
    console.log('🔄 Registering admin user...');
    
    const adminData = {
      name: 'Admin User',
      email: 'admin@fashionconnect.mw',
      password: 'admin123',
      role: 'ADMIN'
    };

    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Admin user registered successfully!');
      console.log('📧 Email: admin@fashionconnect.mw');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: ADMIN');
      console.log('🆔 User ID:', result.data._id);
    } else {
      console.log('⚠️ Registration response:', result);
      if (result.message && result.message.includes('already exists')) {
        console.log('✅ Admin user already exists!');
        console.log('📧 Email: admin@fashionconnect.mw');
        console.log('🔑 Password: admin123');
      }
    }

  } catch (error) {
    console.error('❌ Error registering admin:', error.message);
    console.log('💡 Make sure the backend server is running on port 8000');
  }
};

// Wait a bit for server to start, then register admin
setTimeout(registerAdmin, 3000);
