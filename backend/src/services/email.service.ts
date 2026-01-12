import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Send checkout notification
   */
  async sendCheckoutNotification(
    userEmail: string,
    userName: string,
    itemDetails: string,
    expectedReturnDate: string
  ): Promise<void> {
    const subject = 'Equipment Checkout Confirmation';
    const html = this.getEmailTemplate(
      userName,
      `Your equipment checkout has been confirmed.`,
      `
        <p><strong>Items Checked Out:</strong></p>
        <p>${itemDetails}</p>
        <p><strong>Expected Return Date:</strong> ${expectedReturnDate}</p>
        <p>Please return the equipment on or before the expected return date.</p>
      `,
      `${process.env.FRONTEND_URL}/checkouts`
    );

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send return reminder notification
   */
  async sendReturnReminder(
    userEmail: string,
    userName: string,
    itemDetails: string,
    dueDate: string
  ): Promise<void> {
    const subject = 'Equipment Return Reminder';
    const html = this.getEmailTemplate(
      userName,
      `This is a reminder to return your checked-out equipment.`,
      `
        <p><strong>Items Due:</strong></p>
        <p>${itemDetails}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p style="color: #dc2626;">Please return the equipment as soon as possible to avoid late fees.</p>
      `,
      `${process.env.FRONTEND_URL}/checkouts`
    );

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(
    adminEmail: string,
    itemName: string,
    currentStock: number,
    minStock: number
  ): Promise<void> {
    const subject = `Low Stock Alert: ${itemName}`;
    const html = this.getEmailTemplate(
      'Admin',
      `Low stock alert for ${itemName}`,
      `
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>Current Stock:</strong> ${currentStock}</p>
        <p><strong>Minimum Stock:</strong> ${minStock}</p>
        <p style="color: #dc2626;">Please reorder this item soon.</p>
      `,
      `${process.env.FRONTEND_URL}/inventory`
    );

    await this.sendEmail(adminEmail, subject, html);
  }

  /**
   * Send maintenance ticket notification
   */
  async sendMaintenanceTicketNotification(
    assigneeEmail: string,
    assigneeName: string,
    ticketTitle: string,
    priority: string
  ): Promise<void> {
    const subject = `New Maintenance Ticket Assigned: ${ticketTitle}`;
    const html = this.getEmailTemplate(
      assigneeName,
      `A new maintenance ticket has been assigned to you.`,
      `
        <p><strong>Ticket:</strong> ${ticketTitle}</p>
        <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(priority)};">${priority.toUpperCase()}</span></p>
        <p>Please review and address this ticket as soon as possible.</p>
      `,
      `${process.env.FRONTEND_URL}/maintenance`
    );

    await this.sendEmail(assigneeEmail, subject, html);
  }

  /**
   * Send project assignment notification
   */
  async sendProjectAssignmentNotification(
    userEmail: string,
    userName: string,
    projectTitle: string,
    projectCode: string,
    role: string,
    clientName: string
  ): Promise<void> {
    const subject = `New Project Assignment: ${projectTitle}`;
    const html = this.getEmailTemplate(
      userName,
      `You have been assigned to a new project as ${role}.`,
      `
        <p><strong>Project:</strong> ${projectTitle}</p>
        <p><strong>Project Code:</strong> ${projectCode}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Your Role:</strong> ${role}</p>
        <p>Please review the project details and begin planning your work.</p>
      `,
      `${process.env.FRONTEND_URL}/projects`
    );

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send maintenance reminder notification
   */
  async sendMaintenanceReminder(
    recipientEmail: string,
    recipientName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: Date,
    timeframe: string
  ): Promise<void> {
    const formattedDate = scheduledDate.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Maintenance Reminder: ${itemName} - ${maintenanceType}`;
    const html = this.getMaintenanceReminderTemplate(
      recipientName,
      itemName,
      maintenanceType,
      formattedDate,
      timeframe
    );

    await this.sendEmail(recipientEmail, subject, html);
  }

  /**
   * Send overdue maintenance alert
   */
  async sendMaintenanceOverdueAlert(
    recipientEmail: string,
    recipientName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: Date,
    daysOverdue: number
  ): Promise<void> {
    const formattedDate = scheduledDate.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `OVERDUE: ${itemName} ${maintenanceType} - ${daysOverdue} days overdue`;
    const html = this.getMaintenanceOverdueTemplate(
      recipientName,
      itemName,
      maintenanceType,
      formattedDate,
      daysOverdue
    );

    await this.sendEmail(recipientEmail, subject, html);
  }

  /**
   * Send maintenance completed notification
   */
  async sendMaintenanceCompletedNotification(
    recipientEmail: string,
    recipientName: string,
    itemName: string,
    maintenanceType: string,
    completedBy: string
  ): Promise<void> {
    const subject = `Maintenance Completed: ${itemName} - ${maintenanceType}`;
    const html = this.getEmailTemplate(
      recipientName,
      `The scheduled maintenance has been completed.`,
      `
        <p><strong>Item:</strong> ${itemName}</p>
        <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
        <p><strong>Completed By:</strong> ${completedBy}</p>
        <p><strong>Completed On:</strong> ${new Date().toLocaleDateString('en-MY')}</p>
        <p style="color: #10b981;">✓ The item is now back in service.</p>
      `,
      `${process.env.FRONTEND_URL}/maintenance`
    );

    await this.sendEmail(recipientEmail, subject, html);
  }

  /**
   * Maintenance reminder email template
   */
  private getMaintenanceReminderTemplate(
    userName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: string,
    timeframe: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
          }
          .alert-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            background: #f59e0b;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Maintenance Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <div class="alert-box">
              <p style="margin: 0;"><strong>${itemName}</strong> requires <strong>${maintenanceType}</strong> in <strong>${timeframe}</strong>.</p>
            </div>
            <p><strong>Item:</strong> ${itemName}</p>
            <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
            <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
            <p>Please ensure the maintenance is scheduled and completed on time to maintain equipment reliability.</p>
            <a href="${process.env.FRONTEND_URL}/maintenance" class="button">View Maintenance Schedule</a>
          </div>
          <div class="footer">
            <p>This is an automated reminder from MyCAE Equipment Tracker.</p>
            <p>&copy; ${new Date().getFullYear()} MyCAE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Maintenance overdue email template
   */
  private getMaintenanceOverdueTemplate(
    userName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: string,
    daysOverdue: number
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
          }
          .alert-box {
            background-color: #fee2e2;
            border: 1px solid #dc2626;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            background: #dc2626;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 OVERDUE Maintenance Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <div class="alert-box">
              <p style="margin: 0; color: #dc2626;"><strong>${itemName}</strong> ${maintenanceType} is <strong>${daysOverdue} day(s) OVERDUE</strong>!</p>
            </div>
            <p><strong>Item:</strong> ${itemName}</p>
            <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
            <p><strong>Was Due On:</strong> ${scheduledDate}</p>
            <p style="color: #dc2626;"><strong>Immediate action required.</strong> Please complete this maintenance as soon as possible.</p>
            <a href="${process.env.FRONTEND_URL}/maintenance" class="button">Address Now</a>
          </div>
          <div class="footer">
            <p>This is an automated alert from MyCAE Equipment Tracker.</p>
            <p>&copy; ${new Date().getFullYear()} MyCAE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generic email template
   */
  private getEmailTemplate(
    userName: string,
    message: string,
    content: string,
    actionUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
          }
          .button {
            background: #6366F1;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MyCAE Equipment Tracker</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>${message}</p>
            ${content}
            <a href="${actionUrl}" class="button">View Details</a>
          </div>
          <div class="footer">
            <p>This is an automated message from MyCAE Equipment Tracker.</p>
            <p>&copy; ${new Date().getFullYear()} MyCAE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    };
    return colors[priority.toLowerCase()] || '#6b7280';
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request - MyCAE Tracker';
    const html = this.getPasswordResetTemplate(userName, resetUrl);

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(
    userEmail: string,
    userName: string
  ): Promise<void> {
    const subject = 'Password Reset Successful - MyCAE Tracker';
    const html = this.getPasswordResetConfirmationTemplate(userName);

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Password reset email template
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
          }
          .warning-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            background: #6366F1;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .expiry-notice {
            color: #ef4444;
            font-weight: bold;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your MyCAE Equipment Tracker account.</p>
            <div class="warning-box">
              <p style="margin: 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p class="expiry-notice">⚠️ This link will expire in 1 hour for security reasons.</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #6366F1; word-break: break-all; font-size: 12px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from MyCAE Equipment Tracker.</p>
            <p>For security reasons, never share this link with anyone.</p>
            <p>&copy; ${new Date().getFullYear()} MyCAE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset confirmation email template
   */
  private getPasswordResetConfirmationTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
          }
          .success-box {
            background-color: #d1fae5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .button {
            background: #10b981;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .warning-box {
            background-color: #fee2e2;
            border: 1px solid #dc2626;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <div class="success-box">
              <p style="margin: 0; color: #10b981; font-weight: bold;">Your password has been successfully reset!</p>
            </div>
            <p>You can now log in to your MyCAE Equipment Tracker account with your new password.</p>
            <div class="warning-box">
              <p style="margin: 0; color: #dc2626;"><strong>Important:</strong> If you didn't make this change, please contact your system administrator immediately.</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/login" class="button">Go to Login</a>
          </div>
          <div class="footer">
            <p>This is an automated confirmation from MyCAE Equipment Tracker.</p>
            <p>&copy; ${new Date().getFullYear()} MyCAE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
