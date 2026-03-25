// Simple script to test if the backend API endpoints are available
import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8000/api/v1/health');
    console.log('✅ Health endpoint:', healthResponse.status, await healthResponse.json());
    
    // Test tailor profile endpoint (should return 401 without auth)
    const tailorResponse = await fetch('http://localhost:8000/api/v1/tailors/profile', {
      method: 'PATCH'
    });
    console.log('📋 Tailor profile endpoint status:', tailorResponse.status);
    
    if (tailorResponse.status === 404) {
      console.log('❌ Tailor profile endpoint not found - likely using mock routes');
    } else if (tailorResponse.status === 401) {
      console.log('✅ Tailor profile endpoint found - requires authentication');
    } else {
      console.log('ℹ️  Tailor profile endpoint status:', tailorResponse.status);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testApi();