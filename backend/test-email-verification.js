import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import nodemailer from 'nodemailer';
import emailService from './src/services/emailService.js';
import crypto from 'crypto';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the .env file in the current directory
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🔍 Email Verification System Diagnostic Tool');
console.log('='.repeat(50));

async function testEmailConfiguration() {
  console.log('\n📋 STEP 1: Checking Email Configuration');
  console.log('-'.repeat(50));
  
  // Log environment variables (without exposing sensitive data)
  console.log('Environment Variables Check:');
  console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST ? '✅ Set' : '❌ Not set'}`);
  console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT ? '✅ Set' : '❌ Not set'}`);
  console.log(`- EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`- EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set (length: ' + (process.env.EMAIL_PASSWORD?.length || 0) + ')' : '❌ Not set'}`);
  console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL ? '✅ Set' : '❌ Not set'}`);
  console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'Not set (will default to development)'}`);
  
  // Create a test transporter
  try {
    console.log('\nCreating test transporter...');
    const testTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Verifying SMTP connection...');
    const verifyResult = await testTransporter.verify();
    console.log(`SMTP Connection: ${verifyResult ? '✅ Success' : '❌ Failed'}`);
    
    return verifyResult;
  } catch (error) {
    console.error('❌ SMTP Configuration Error:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your EMAIL_PASSWORD is correct');
    console.log('2. If using Gmail, ensure "Less secure app access" is enabled or use an App Password');
    console.log('3. Check if your network allows outgoing SMTP connections');
    console.log('4. Verify the EMAIL_HOST and EMAIL_PORT settings');
    return false;
  }
}

async function testSendVerificationEmail() {
  console.log('\n📋 STEP 2: Testing Verification Email Sending');
  console.log('-'.repeat(50));
  
  const testEmail = process.env.EMAIL_USER; // Use your own email for testing
  const testToken = crypto.randomBytes(32).toString('hex');
  
  console.log(`Sending test verification email to: ${testEmail}`);
  console.log(`Using token: ${testToken.substring(0, 10)}...`);
  
  try {
    const result = await emailService.sendVerificationEmail(testEmail, testToken);
    console.log('✅ Email sending result:', result);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

async function testEmailTemplate() {
  console.log('\n📋 STEP 3: Testing Email Template Generation');
  console.log('-'.repeat(50));
  
  const testEmail = 'test@example.com';
  const testToken = 'test-token-123';
  const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?email=${encodeURIComponent(testEmail)}&token=${testToken}`;
  
  try {
    console.log('Generating verification email template...');
    const template = emailService.generateVerificationEmailTemplate(testEmail, testToken, testUrl);
    
    console.log('✅ Template generated successfully');
    console.log(`Subject: ${template.subject}`);
    console.log('HTML Content Length:', template.html.length);
    console.log('Text Content Length:', template.text.length);
    
    return true;
  } catch (error) {
    console.error('❌ Template generation failed:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('\n🚀 Starting Email Verification System Diagnostics\n');
  
  // Step 1: Check configuration
  const configOk = await testEmailConfiguration();
  
  // Step 2: Test email template
  const templateOk = await testEmailTemplate();
  
  // Step 3: Test sending verification email
  let sendingOk = false;
  if (configOk) {
    sendingOk = await testSendVerificationEmail();
  } else {
    console.log('\n⚠️ Skipping email sending test due to configuration issues');
  }
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log(`Email Configuration: ${configOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Template: ${templateOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Sending: ${sendingOk ? '✅ PASS' : configOk ? '❌ FAIL' : '⚠️ SKIPPED'}`);
  
  if (!configOk || !templateOk || !sendingOk) {
    console.log('\n🔧 TROUBLESHOOTING RECOMMENDATIONS:');
    
    if (!configOk) {
      console.log('- Double-check your .env file for correct email settings');
      console.log('- Verify your email provider settings (Gmail, Mailtrap, etc.)');
      console.log('- If using Gmail, create an App Password instead of your regular password');
      console.log('- Check if your email provider blocks automated emails');
    }
    
    if (!templateOk) {
      console.log('- Check the emailService.js file for template generation issues');
      console.log('- Ensure all required variables are available in the template');
    }
    
    if (configOk && !sendingOk) {
      console.log('- Check if your email provider has sending limits');
      console.log('- Verify that your account has sending permissions');
      console.log('- Look for any error messages in the email service logs');
    }
  } else {
    console.log('\n🎉 All tests passed! Your email verification system is working correctly.');
  }
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Diagnostic failed with error:', error);
});