// Test script to verify fixes
console.log('🧪 Testing fixes for checkout and image messaging...');

// Test 1: Check if frontend is running
async function testFrontend() {
  try {
    const response = await fetch('http://localhost:5174');
    console.log('✅ Frontend is running on port 5174');
    return true;
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    return false;
  }
}

// Test 2: Check if backend is running
async function testBackend() {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Backend is running on port 8000');
    return true;
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
    return false;
  }
}

// Test 3: Check uploads directory
const fs = require('fs');
const path = require('path');

function testUploadsDirectory() {
  const uploadsPath = path.join(__dirname, 'backend', 'uploads');
  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    console.log(`✅ Uploads directory exists with ${files.length} files`);
    return true;
  } else {
    console.log('❌ Uploads directory not found');
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n🔍 Running connectivity tests...\n');
  
  const frontendOk = await testFrontend();
  const backendOk = await testBackend();
  const uploadsOk = testUploadsDirectory();
  
  console.log('\n📊 Test Results:');
  console.log(`Frontend: ${frontendOk ? '✅' : '❌'}`);
  console.log(`Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`Uploads: ${uploadsOk ? '✅' : '❌'}`);
  
  if (frontendOk && backendOk && uploadsOk) {
    console.log('\n🎉 All systems are ready for testing!');
    console.log('\n📝 Next steps:');
    console.log('1. Test checkout process in browser');
    console.log('2. Test image messaging in conversations');
    console.log('3. Check browser console for any errors');
  } else {
    console.log('\n⚠️ Some systems need attention before testing');
  }
}

runTests().catch(console.error);