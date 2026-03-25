// Simple test to verify server is working
import fetch from 'node-fetch';

async function testServer() {
  try {
    console.log('🔍 Testing if backend server is running...');
    
    // Test health endpoint
    const response = await fetch('http://localhost:8000/api/v1/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is running!');
      console.log('📊 Health check response:', data);
      
      if (data.usingMockData) {
        console.log('⚠️  Server is using mock data');
      } else {
        console.log('✅ Server is using database routes');
      }
    } else {
      console.log('❌ Server returned status:', response.status);
    }
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    console.log('🔧 Make sure the backend server is running on port 8000');
  }
}

testServer();