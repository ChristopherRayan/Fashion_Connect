import dotenv from 'dotenv';
import emailService from './src/services/emailService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Email Service...');

async function testEmailService() {
  try {
    console.log('📧 Testing email verification...');
    
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';
    
    const result = await emailService.sendVerificationEmail(testEmail, testToken);
    
    console.log('✅ Email service test completed:', result);
  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
}

testEmailService();
