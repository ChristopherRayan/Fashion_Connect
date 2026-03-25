import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8000/api/v1';

// Test document upload functionality
async function testDocumentUpload() {
  try {
    console.log('🧪 Testing document upload functionality...\n');

    // Just check if we can access the endpoint
    console.log('1️⃣ Testing document upload endpoint availability...');

    // Use a test token (this is just to test the endpoint structure)
    const testToken = 'test-token';

    // Step 2: Create a test document file
    console.log('\n2️⃣ Creating test document...');
    const testDocContent = 'This is a test document for designer verification';
    const testDocPath = path.join(process.cwd(), 'test-document.txt');
    fs.writeFileSync(testDocPath, testDocContent);
    console.log('✅ Test document created:', testDocPath);

    // Step 3: Upload documents
    console.log('\n3️⃣ Uploading documents...');
    const formData = new FormData();
    formData.append('nationalId', fs.createReadStream(testDocPath));
    formData.append('businessRegistration', fs.createReadStream(testDocPath));

    const uploadResponse = await fetch(`${BASE_URL}/users/designer/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('📤 Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('❌ Upload failed:', error);
      return;
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Documents uploaded successfully');
    console.log('📄 Upload result:', JSON.stringify(uploadData, null, 2));

    // Step 4: Verify documents in database
    console.log('\n4️⃣ Checking user in database...');
    const userCheckResponse = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (userCheckResponse.ok) {
      const userData = await userCheckResponse.json();
      console.log('👤 User documents in database:');
      console.log(JSON.stringify(userData.data.documents, null, 2));
    }

    // Cleanup
    fs.unlinkSync(testDocPath);
    console.log('\n🧹 Test document cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDocumentUpload();
