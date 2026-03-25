import fetch from 'node-fetch';

console.log('🧪 Testing Email Verification API...');

async function testEmailVerificationAPI() {
  try {
    const testEmail = 'testd@gmail.com';
    
    console.log(`📧 Requesting verification for: ${testEmail}`);
    
    const response = await fetch('http://localhost:8000/api/v1/auth/request-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailVerificationAPI();
