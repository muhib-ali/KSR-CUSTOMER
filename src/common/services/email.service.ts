import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAILTRAP_HOST'),
      port: this.configService.get('MAILTRAP_PORT'),
      auth: {
        user: this.configService.get('MAILTRAP_USER'),
        pass: this.configService.get('MAILTRAP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const fromEmail = this.configService.get('MAILTRAP_FROM_EMAIL');
    const fromName = this.configService.get('MAILTRAP_FROM_NAME');
    const frontendUrl = this.configService.get('FRONTEND_URL');
    
    const verificationLink = `${frontendUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: '✉️ Verify Your Email Address',
      html: this.getEmailTemplate(verificationLink, email),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw error;
    }
  }

  private getEmailTemplate(verificationLink: string, email: string): string {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - KSR Performance</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #e5e5e5;
      background-color: #000000;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0a0a0a;
      border-radius: 0;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid #1a1a1a;
    }
    .email-header {
      background: #000000;
      border-bottom: 3px solid #dc2626;
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      margin-bottom: 15px;
      letter-spacing: 2px;
    }
    .logo .performance {
      color: #dc2626;
    }
    .email-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-header p {
      font-size: 16px;
      opacity: 0.85;
      color: #a3a3a3;
    }
    .email-body {
      padding: 40px 30px;
      background-color: #0a0a0a;
    }
    .email-body h2 {
      color: #ffffff;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .email-body p {
      color: #a3a3a3;
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.8;
    }
    .email-info {
      background-color: #1a1a1a;
      border-left: 4px solid #dc2626;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 0;
    }
    .email-info strong {
      color: #ffffff;
      display: block;
      margin-bottom: 5px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }
    .email-info span {
      color: #dc2626;
      font-weight: 600;
      font-size: 16px;
    }
    .verify-button-container {
      text-align: center;
      margin: 35px 0;
    }
    .verify-button {
      display: inline-block;
      background: #dc2626;
      color: white !important;
      padding: 16px 48px;
      text-decoration: none;
      border-radius: 0;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      transition: all 0.3s ease;
      border: 2px solid #dc2626;
    }
    .verify-button:hover {
      background: #b91c1c;
      border-color: #b91c1c;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.6);
    }
    .alternative-link {
      background-color: #1a1a1a;
      padding: 20px;
      border-radius: 0;
      margin: 25px 0;
      border: 1px solid #262626;
    }
    .alternative-link p {
      font-size: 13px;
      color: #a3a3a3;
      margin-bottom: 10px;
    }
    .alternative-link p strong {
      color: #ffffff;
      font-weight: 700;
    }
    .alternative-link a {
      color: #dc2626;
      word-break: break-all;
      font-size: 12px;
      text-decoration: none;
    }
    .alternative-link a:hover {
      text-decoration: underline;
    }
    .warning-box {
      background-color: #1a1a1a;
      border-left: 4px solid #dc2626;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 0;
    }
    .warning-box p {
      color: #a3a3a3;
      font-size: 14px;
      margin: 0;
    }
    .warning-box strong {
      color: #dc2626;
      font-weight: 700;
    }
    .email-footer {
      background-color: #000000;
      padding: 30px;
      text-align: center;
      border-top: 3px solid #dc2626;
    }
    .email-footer p {
      color: #737373;
      font-size: 13px;
      margin: 5px 0;
    }
    .email-footer .company-name {
      color: #ffffff;
      font-weight: 700;
      margin-top: 15px;
      font-size: 14px;
      letter-spacing: 2px;
    }
    .email-footer .company-name .red {
      color: #dc2626;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo">KSR<span class="performance">PERFORMANCE</span></div>
      <div class="icon">📧</div>
      <h1>Email Verification</h1>
      <p>Welcome! Let's verify your email address</p>
    </div>
    
    <div class="email-body">
      <h2>Hello there! 👋</h2>
      
      <p>
        Thank you for signing up! We're excited to have you on board. 
        To complete your registration and ensure the security of your account, 
        please verify your email address.
      </p>
      
      <div class="email-info">
        <strong>Email Address:</strong>
        <span>${email}</span>
      </div>
      
      <p>
        Click the button below to verify your email address:
      </p>
      
      <div class="verify-button-container">
        <a href="${verificationLink}" class="verify-button" target="_blank">
          ✓ Verify Email Address
        </a>
      </div>
      
      <div class="alternative-link">
        <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      </div>
      
      <div class="warning-box">
        <p>
          <strong>⚠️ Security Notice:</strong> 
          This verification link will expire in 10 minutes. 
          If you didn't create an account, please ignore this email.
        </p>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px;">
        After verification, you'll be able to complete your registration by verifying 
        your phone number and setting up your account.
      </p>
    </div>
    
    <div class="email-footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>If you have any questions, please contact our support team.</p>
      <p class="company-name">KSR<span class="red">PERFORMANCE</span></p>
      <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
