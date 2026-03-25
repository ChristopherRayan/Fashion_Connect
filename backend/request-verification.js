import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import readline from 'readline';
import fetch from 'node-fetch';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the .env file in the current directory
dotenv.config({ path: resolve(__dirname, '.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to request email verification
async function requestVerification(email, role = 'CLIENT') {
  try {
    console.log(`\n📧 Requesting verification for: ${email}`);
    console.log(`👤 Role: ${role}`);
    
    const apiUrl = `http://localhost:${process.env.PORT || 8000}/api/v1/auth/request-verification`;
    console.log(`🔗 API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role
      })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Verification email sent successfully!');
      console.log('📝 Response:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.previewUrl) {
        console.log(`🔗 Preview URL: ${data.data.previewUrl}`);
      }
      
      console.log('\n💡 Check your email inbox for the verification link');
      console.log('⏰ The verification link will expire in 24 hours');
    } else {
      console.log('❌ Error sending verification email:');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Main function
async function main() {
  console.log('🔐 Email Verification Request Tool');
  console.log('='.repeat(50));
  
  // Prompt for email
  rl.question('Enter email address to verify: ', (email) => {
    if (!isValidEmail(email)) {
      console.log('❌ Invalid email format. Please try again.');
      rl.close();
      return;
    }
    
    // Prompt for role
    rl.question('Select role (1 for CLIENT, 2 for DESIGNER): ', async (roleChoice) => {
      let role = 'CLIENT';
      
      if (roleChoice === '2') {
        role = 'DESIGNER';
      }
      
      await requestVerification(email, role);
      rl.close();
    });
  });
}

// Run the main function
main().catch(error => {
  console.error('❌ Program failed with error:', error);
  rl.close();
});