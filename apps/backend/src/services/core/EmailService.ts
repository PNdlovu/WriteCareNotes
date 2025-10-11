/**
 * @fileoverview Email Service
 * @module Services/Core/EmailService
 * @version 1.0.0
 * @since 2025-10-09
 * @description Production email service using nodemailer
 */

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetLink: string;
  firstName: string;
  expiryHours?: number;
}

export class EmailService {
  privatetransporter: Transporter;
  privatefromAddress: string;
  privatefromName: string;

  const ructor() {
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@writecarenotes.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'WriteCareNotes';

    // Configure nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from = options.from || `"${this.fromName}" <${this.fromAddress}>`;

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject
      });
    } catch (error) {
      logger.error('Error sending email', {
        to: options.to,
        subject: options.subject,
        error
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const expiryHours = data.expiryHours || 1;
    const subject = 'Password Reset Request - WriteCareNotes';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #0066cc; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { 
            background: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${data.firstName},</p>
            
            <p>We received a request to reset your password for your WriteCareNotes account.</p>
            
            <p>Click the button below to reset yourpassword:</p>
            
            <a href="${data.resetLink}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into yourbrowser:</p>
            <p style="word-break: break-all; color: #0066cc;">${data.resetLink}</p>
            
            <div class="warning">
              <strong>⚠️ SecurityNotice:</strong>
              <ul>
                <li>This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}</li>
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email and contact support immediately</li>
              </ul>
            </div>
            
            <p>For security reasons, you will be logged out of all devices after resetting your password.</p>
            
            <p>If you have any questions or concerns, please contact our support team.</p>
            
            <p>Best regards,<br>WriteCareNotes Security Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2025 WriteCareNotes. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - WriteCareNotes

Hello ${data.firstName},

We received a request to reset your password for your WriteCareNotes account.

Click the link below to reset yourpassword:
${data.resetLink}

SECURITY NOTICE:
- This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}
- This link can only be used once
- If you didn't request this reset, please ignore this email and contact support immediately

For security reasons, you will be logged out of all devices after resetting your password.

If you have any questions or concerns, please contact our support team.

Best regards,
WriteCareNotes Security Team

---
This is an automated message, please do not reply to this email.
© 2025 WriteCareNotes. All rights reserved.
    `.trim();

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error });
      return false;
    }
  }
}
