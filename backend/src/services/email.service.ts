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
}

export default new EmailService();
