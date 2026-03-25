// Simple test to check document upload endpoint
import fs from 'fs';

async function testUpload() {
  try {
    console.log('🧪 Testing document upload endpoint...');
    
    // First, let's register a user and get a token
    const registerPayload = {
      name: 'Test Upload User',
      email: `testupload${Date.now()}@example.com`,
      password: 'password123',
      role: 'DESIGNER'
    };

    console.log('📤 Registration payload:', registerPayload);

    const registerResponse = await fetch('http://localhost:8000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerPayload)
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      throw new Error(`Registration failed: ${error}`);
    }

    const registerData = await registerResponse.json();
    console.log('✅ User registered successfully');
    console.log('📊 Registration response:', JSON.stringify(registerData, null, 2));

    const accessToken = registerData.data?.accessToken;
    console.log('🔑 Got access token:', accessToken ? 'Yes' : 'No');
    console.log('🔑 Token preview:', accessToken ? `${accessToken.substring(0, 50)}...` : 'None');

    // Create a test file
    const testContent = 'This is a test document for upload verification';
    fs.writeFileSync('test-doc.txt', testContent);
    console.log('📄 Test document created');

    // Now test the upload endpoint
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('nationalId', fs.createReadStream('test-doc.txt'));

    console.log('📤 Attempting to upload document...');
    
    const uploadResponse = await fetch('http://localhost:8000/api/v1/users/designer/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('📡 Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', errorText);
    } else {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadData);
    }

    // Cleanup
    fs.unlinkSync('test-doc.txt');
    console.log('🧹 Cleaned up test file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();
