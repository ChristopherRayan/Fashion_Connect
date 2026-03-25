import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Mailtrap Connection Directly...');

async function testMailtrapDirect() {
  try {
    console.log('📧 Creating transporter...');
    
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: false,
      auth: {
        user: '3f3e5e082a0494',
        pass: 'bb7c83aef1a952'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    });

    console.log('🔍 Verifying connection...');
    
    // Test connection
    const verified = await transporter.verify();
    console.log('✅ Connection verified:', verified);

    console.log('📧 Sending test email...');
    
    // Send test email
    const info = await transporter.sendMail({
      from: '"FashionConnect" <noreply@fashionconnect.mw>',
      to: 'test@example.com',
      subject: 'Test Email from FashionConnect',
      text: 'This is a test email to verify Mailtrap integration.',
      html: '<p>This is a <b>test email</b> to verify Mailtrap integration.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMailtrapDirect();
