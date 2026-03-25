import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing JWT token generation...');

// Test environment variables
console.log('🔍 Environment variables:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? 'Set' : 'Missing');
console.log('ACCESS_TOKEN_EXPIRY:', process.env.ACCESS_TOKEN_EXPIRY);
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? 'Set' : 'Missing');
console.log('REFRESH_TOKEN_EXPIRY:', process.env.REFRESH_TOKEN_EXPIRY);

// Test token generation
try {
  const testPayload = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: 'DESIGNER'
  };

  console.log('\n🔑 Generating access token...');
  const accessToken = jwt.sign(
    testPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  console.log('✅ Access token generated:', accessToken ? `${accessToken.substring(0, 50)}...` : 'Failed');

  console.log('\n🔑 Generating refresh token...');
  const refreshToken = jwt.sign(
    { _id: testPayload._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  console.log('✅ Refresh token generated:', refreshToken ? `${refreshToken.substring(0, 50)}...` : 'Failed');

  // Test token verification
  console.log('\n🔍 Verifying access token...');
  const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  console.log('✅ Token verified successfully:', decoded);

} catch (error) {
  console.error('❌ JWT test failed:', error.message);
}
