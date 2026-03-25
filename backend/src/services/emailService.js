import nodemailer from 'nodemailer';
import { ApiError } from '../utils/ApiError.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialized = false;
    this.appName = 'Fashion Connect';
  }

  // Lazy initialization to ensure environment variables are loaded
  ensureInitialized() {
    if (!this.initialized) {
      this.isProduction = process.env.NODE_ENV === 'production';
      this.fromEmail = process.env.FROM_EMAIL || 'noreply@fashionconnect.mw';
      this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      this.initializeTransporter();
      this.initialized = true;
    }
  }

  initializeTransporter() {
    try {
      // Debug: Log environment variables for troubleshooting
      console.log('🔍 Email Environment Check:', {
        EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Not set',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set',
        EMAIL_HOST: process.env.EMAIL_HOST ? '✅ Set' : '❌ Not set',
        EMAIL_PORT: process.env.EMAIL_PORT ? '✅ Set' : '❌ Not set',
        NODE_ENV: process.env.NODE_ENV,
        isProduction: this.isProduction
      });

      // Configure transporter based on environment
      if (this.isProduction && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        // Production configuration (use your actual email service)
        this.transporter = nodemailer.createTransport({
          service: 'gmail', // or your preferred service
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        this.isConfigured = true;
      } else if (!this.isProduction && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        // Development configuration
        if (process.env.EMAIL_HOST) {
          // Custom SMTP (like Mailtrap)
          console.log(`📧 Configuring Mailtrap SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
          this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 2525,
            secure: false, // true for 465, false for other ports like 2525
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            },
            tls: {
              rejectUnauthorized: false // Allow self-signed certificates
            },
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
            debug: true, // Enable debug output
            logger: true // Log to console
          });
        } else {
          // Gmail SMTP configuration
          console.log(`📧 Configuring Gmail SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
          this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            },
            tls: {
              rejectUnauthorized: false
            }
          });
        }
        this.isConfigured = true;
        console.log('✅ Email service configured with SMTP credentials');

        // Test the connection immediately
        if (this.transporter) {
          this.transporter.verify((error, success) => {
            if (error) {
              console.error('❌ SMTP connection verification failed:', error.message);
              console.log('🔄 Will attempt to send emails anyway and fall back to console mode if needed');
            } else {
              console.log('✅ SMTP connection verified successfully - emails will be delivered via Gmail');
            }
          });
        }
      } else {
        // No email configuration - use console logging for development
        console.log('📧 Email service running in console-only mode (no SMTP credentials)');
        this.isConfigured = false;
      }

      console.log('📧 Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  // Send email using configured transporter or fall back to console logging
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      // Ensure service is initialized with environment variables
      this.ensureInitialized();

      // Prepare mail options
      const mailOptions = {
        from: {
          name: 'FashionConnect',
          address: this.fromEmail
        },
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || ''
      };

      // If transporter is configured, try to send email
      if (this.isConfigured && this.transporter) {
        try {
          console.log(`📧 Attempting to send email to: ${to}`);
          console.log(`📧 Using SMTP host: ${process.env.EMAIL_HOST}`);
          
          const info = await this.transporter.sendMail(mailOptions);
          
          console.log('✅ Email sent successfully via SMTP:', {
            messageId: info.messageId,
            to: to,
            preview: !this.isProduction ? nodemailer.getTestMessageUrl(info) : undefined
          });
          
          return {
            success: true,
            messageId: info.messageId,
            previewUrl: !this.isProduction ? nodemailer.getTestMessageUrl(info) : undefined
          };
        } catch (smtpError) {
          console.error('❌ SMTP sending failed, falling back to console mode:');
          console.error('   Error Code:', smtpError.code);
          console.error('   Error Message:', smtpError.message);
          console.error('   SMTP Host:', process.env.EMAIL_HOST);
          console.error('   SMTP Port:', process.env.EMAIL_PORT);
          
          // Only throw in production, fall back to console in development
          if (this.isProduction) {
            throw smtpError;
          }
          // Fall through to console mode in development
        }
      }

      // Development fallback - log to console
      console.log('\n📧 EMAIL SENT (Development Mode)');
      console.log('=====================================');
      console.log(`To: ${to}`);
      console.log(`From: ${this.fromEmail}`);
      console.log(`Subject: ${subject}`);
      console.log('-------------------------------------');
      console.log('HTML Content:');
      console.log(htmlContent);
      if (textContent) {
        console.log('-------------------------------------');
        console.log('Text Content:');
        console.log(textContent);
      }
      console.log('=====================================\n');

      return {
        success: true,
        messageId: `console-${Date.now()}`,
        message: 'Email sent successfully (development mode - console only)'
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new ApiError(500, `Failed to send email: ${error.message}`);
    }
  }

  async verifyConnection() {
    if (!this.isConfigured) {
      throw new ApiError(500, 'Email service not configured');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      throw new ApiError(500, 'Email service connection failed');
    }
  }

  generateVerificationEmailTemplate(email, token, verificationUrl) {
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@fashionconnect.com';

    return {
      subject: 'Verify Your Email - FashionConnect',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - FashionConnect</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .logo .fashion {
              color: #fbbf24;
              text-shadow: 1px 1px 0 #000;
            }
            .logo .connect {
              color: #374151;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: #000;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              text-align: center;
              margin: 20px 0;
              box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3);
            }
            .warning {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="fashion">FASHION</span><span class="connect">CONNECT</span>
              </div>
              <p style="color: #6b7280; margin: 0;">Malawi's Premier Fashion Marketplace</p>
            </div>

            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address</h2>

              <p>Hello!</p>

              <p>Thank you for joining FashionConnect! To complete your registration, please verify your email address.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="verify-button">
                  Verify Email Address
                </a>
              </div>

              <div class="warning">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours.
              </div>

              <p>If the button doesn't work, copy this link: ${verificationUrl}</p>
            </div>

            <div class="footer">
              <p>If you didn't create an account, you can ignore this email.</p>
              <p>Need help? Contact us at ${supportEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        FashionConnect - Email Verification

        Hello! Thank you for joining FashionConnect!

        Please verify your email by clicking: ${verificationUrl}

        This link expires in 24 hours.

        If you didn't create an account, ignore this email.

        The FashionConnect Team
      `
    };
  }

  async sendVerificationEmail(email, token, role) {
    try {
      // Ensure service is initialized with environment variables
      this.ensureInitialized();

      const verificationUrl = `${this.frontendUrl}/verify-email?email=${encodeURIComponent(email)}&token=${token}${role ? `&role=${encodeURIComponent(role)}` : ''}`;

      // Debug logging
      console.log('🔍 Email Service Debug:', {
        email,
        token: token.substring(0, 10) + '...',
        role,
        verificationUrl
      });

      const emailTemplate = this.generateVerificationEmailTemplate(email, token, verificationUrl);

      if (this.isConfigured && this.transporter) {
        try {
          const mailOptions = {
            from: {
              name: 'FashionConnect',
              address: this.fromEmail
            },
            to: email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          };

          console.log(`📧 Attempting to send verification email to: ${email}`);
          console.log(`📧 Using SMTP host: ${process.env.EMAIL_HOST}`);

          const info = await this.transporter.sendMail(mailOptions);

          console.log('✅ Verification email sent successfully via SMTP:', {
            messageId: info.messageId,
            to: email,
            preview: !this.isProduction ? nodemailer.getTestMessageUrl(info) : undefined
          });

          return {
            success: true,
            messageId: info.messageId,
            previewUrl: !this.isProduction ? nodemailer.getTestMessageUrl(info) : undefined
          };
        } catch (smtpError) {
          console.error('❌ SMTP sending failed, falling back to console mode:');
          console.error('   Error Code:', smtpError.code);
          console.error('   Error Message:', smtpError.message);
          console.error('   SMTP Host:', process.env.EMAIL_HOST);
          console.error('   SMTP Port:', process.env.EMAIL_PORT);
          console.log('🔄 Switching to console mode for development...');
          // Fall through to console mode
        }
      }

      // Development fallback - log to console (either not configured or SMTP failed)
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL VERIFICATION - DEVELOPMENT MODE');
      console.log('='.repeat(80));
      console.log(`📬 To: ${email}`);
      console.log(`📝 Subject: ${emailTemplate.subject}`);
      console.log('='.repeat(80));
      console.log('🔗 VERIFICATION URL (Copy and paste in browser):');
      console.log(`   ${verificationUrl}`);
      console.log('='.repeat(80));
      console.log('💡 TIP: Copy the URL above and paste it in your browser to verify the email');
      console.log('📧 In production, this would be sent via email to the user');
      console.log('='.repeat(80) + '\n');

      return {
        success: true,
        messageId: `console-${Date.now()}`,
        verificationUrl,
        mode: 'console'
      };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new ApiError(500, `Failed to send verification email: ${error.message}`);
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const subject = `Welcome to ${this.appName}!`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to ${this.appName}!</h1>
        <p>Hello ${user.name},</p>
        <p>Thank you for joining ${this.appName}. We're excited to have you as part of our community!</p>
        
        ${user.role === 'DESIGNER' ? `
          <p>As a designer, you can now:</p>
          <ul>
            <li>Create and showcase your products</li>
            <li>Manage orders from clients</li>
            <li>Build your designer profile</li>
          </ul>
        ` : `
          <p>As a client, you can now:</p>
          <ul>
            <li>Browse unique designs from Malawian designers</li>
            <li>Place orders for custom pieces</li>
            <li>Connect with talented local designers</li>
          </ul>
        `}

        <p>Best regards,<br>The ${this.appName} Team</p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  // Send tailor invitation email
  async sendTailorInvitation({ to, tailorName, designerName, designerBusinessName, verificationUrl }) {
    const subject = `Invitation to Join ${this.appName} as a Tailor`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tailor Invitation - ${this.appName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
          }
          .title {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #d4af37;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #b8941f;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
          }
          .warning {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${this.appName}</div>
            <h1 class="title">You're Invited to Join as a Tailor!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${tailorName},</p>
            
            <p>Great news! <strong>${designerName}</strong> from <strong>${designerBusinessName}</strong> has invited you to join ${this.appName} as a skilled tailor.</p>
            
            <div class="highlight">
              <h3>🎯 What This Means:</h3>
              <ul>
                <li>You'll work directly with ${designerName} on custom fashion orders</li>
                <li>Receive orders and manage your workflow through our platform</li>
                <li>Get paid for your excellent tailoring skills</li>
                <li>Build your reputation in the fashion industry</li>
              </ul>
            </div>
            
            <p>To get started, please click the button below to set up your account:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="cta-button">Complete Account Setup</a>
            </div>
            
            <p>During setup, you'll be able to:</p>
            <ul>
              <li>Create your secure password</li>
              <li>Add your address and contact details</li>
              <li>Specify your tailoring specialties</li>
              <li>Set your experience level</li>
            </ul>
            
            <div class="warning">
              <strong>⏰ Important:</strong> This invitation expires in 24 hours. Please complete your setup as soon as possible.
            </div>
            
            <p>If you have any questions, feel free to contact ${designerName} directly or reach out to our support team.</p>
            
            <p>We're excited to have you join our community of talented tailors!</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The ${this.appName} Team</p>
            <p><small>If you didn't expect this invitation, you can safely ignore this email.</small></p>
            <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a></small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      You're Invited to Join ${this.appName} as a Tailor!
      
      Hello ${tailorName},
      
      ${designerName} from ${designerBusinessName} has invited you to join ${this.appName} as a skilled tailor.
      
      To complete your account setup, visit: ${verificationUrl}
      
      This invitation expires in 24 hours.
      
      Best regards,
      The ${this.appName} Team
    `;

    return await this.sendEmail(to, subject, htmlContent, textContent);
  }
}

const emailServiceInstance = new EmailService();
export default emailServiceInstance;
export const sendEmail = (toOrOptions, subject, html, text = null) => {
  if (typeof toOrOptions === 'object' && toOrOptions !== null) {
    const { to, subject: subj, html: htmlContent, text: textContent } = toOrOptions;
    return emailServiceInstance.sendEmail(to, subj, htmlContent, textContent);
  }
  return emailServiceInstance.sendEmail(toOrOptions, subject, html, text);
};