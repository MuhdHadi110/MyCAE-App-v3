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
    companyName: string,
    contactName: string,
    contactEmail: string,
    managerName: string
  ): Promise<void> {
    const subject = `New Project Assignment: ${projectTitle}`;
    const html = this.getProjectAssignmentTemplate(
      userName,
      projectTitle,
      projectCode,
      role,
      companyName,
      contactName,
      contactEmail,
      managerName
    );

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Project assignment email template - Clean professional format
   */
  private getProjectAssignmentTemplate(
    userName: string,
    projectTitle: string,
    projectCode: string,
    role: string,
    companyName: string,
    contactName: string,
    contactEmail: string,
    managerName: string
  ): string {
    const isManager = role.toLowerCase().includes('manager');

    // Build the role/reporting line based on whether they are manager or not
    const roleOrReportingLine = isManager
      ? `Role : ${role}`
      : `Reporting to : ${managerName}`;

    // For Project Manager: no contact line
    // For Lead Engineer: contact the Project Manager
    const contactLine = isManager
      ? ''
      : ` Should you have any questions or require further clarification, please do not hesitate to reach ${managerName}.`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p>You are hereby officially assigned to the <strong>${projectTitle}</strong> project. Please refer to the details of the project below:</p>

    <p style="margin: 20px 0;">
      Company Name : ${companyName}<br>
      Customer Representative : ${contactName}<br>
      Customer Email : ${contactEmail}<br>
      Project Code : ${projectCode}<br>
      ${roleOrReportingLine}
    </p>

    <p>Look forward to your contribution and commitment to ensuring the successful delivery of this project.${contactLine}</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
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
   * Maintenance reminder email template - Clean professional format
   */
  private getMaintenanceReminderTemplate(
    userName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: string,
    timeframe: string
  ): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'hadi@mycae.com.my';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p>This is a reminder that <strong>${itemName}</strong> requires <strong>${maintenanceType}</strong> in <strong>${timeframe}</strong>.</p>

    <p style="margin: 20px 0;">
      Equipment : ${itemName}<br>
      Maintenance Type : ${maintenanceType}<br>
      Scheduled Date : ${scheduledDate}
    </p>

    <p>Please ensure the maintenance is scheduled and completed on time to maintain equipment reliability.</p>

    <p>Should you have any questions, please contact ${supportEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Maintenance overdue email template - Clean professional format
   */
  private getMaintenanceOverdueTemplate(
    userName: string,
    itemName: string,
    maintenanceType: string,
    scheduledDate: string,
    daysOverdue: number
  ): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'hadi@mycae.com.my';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p><strong>URGENT:</strong> <strong>${itemName}</strong> ${maintenanceType} is <strong>${daysOverdue} day(s) OVERDUE</strong>.</p>

    <p style="margin: 20px 0;">
      Equipment : ${itemName}<br>
      Maintenance Type : ${maintenanceType}<br>
      Was Due On : ${scheduledDate}<br>
      Days Overdue : ${daysOverdue}
    </p>

    <p>Immediate action is required. Please complete this maintenance as soon as possible to ensure equipment reliability and safety.</p>

    <p>Should you have any questions, please contact ${supportEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generic email template - Clean professional format
   */
  private getEmailTemplate(
    userName: string,
    message: string,
    content: string,
    actionUrl: string
  ): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'hadi@mycae.com.my';

    // Convert HTML content to plain text format
    // Replace <p><strong>Label:</strong> Value</p> with Label : Value<br>
    const plainContent = content
      .replace(/<p><strong>([^<]+):<\/strong>\s*([^<]*)<\/p>/g, '$1 : $2<br>')
      .replace(/<p[^>]*>/g, '')
      .replace(/<\/p>/g, '<br>')
      .replace(/<strong>/g, '<strong>')
      .replace(/<\/strong>/g, '</strong>')
      .replace(/<br>\s*<br>/g, '<br>')
      .trim();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p>${message}</p>

    <p style="margin: 20px 0;">
      ${plainContent}
    </p>

    <p>Should you have any questions, please contact ${supportEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
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
   * Password reset email template - Clean professional format
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'hadi@mycae.com.my';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p>We received a request to reset your password for your MyCAE Equipment Tracker account.</p>

    <p>To reset your password, please click the link below:</p>

    <p style="margin: 20px 0;">
      <a href="${resetUrl}" style="color: #0066cc;">${resetUrl}</a>
    </p>

    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>

    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

    <p>Should you have any questions, please contact ${supportEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password reset confirmation email template - Clean professional format
   */
  private getPasswordResetConfirmationTemplate(userName: string): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'hadi@mycae.com.my';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${userName},</p>

    <p>Your password has been successfully reset.</p>

    <p>You can now log in to your MyCAE Equipment Tracker account with your new password at:</p>

    <p style="margin: 20px 0;">
      <a href="${loginUrl}" style="color: #0066cc;">${loginUrl}</a>
    </p>

    <p><strong>Important:</strong> If you didn't make this change, please contact your system administrator immediately at ${supportEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
  }
 
  async sendInvoiceApprovalRequest(
    invoiceId: string,
    mds: any[],
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    creatorName: string,
    creatorEmail: string,
    submittedDate: string,
    submittedTime: string
  ): Promise<void> {
    console.log('Email service disabled: sendInvoiceApprovalRequest called');
  }

  async sendInvoiceApprovalConfirmation(
    invoiceId: string,
    creatorEmail: string,
    creatorName: string,
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    approverName: string,
    approvedDate: string,
    approvedTime: string
  ): Promise<void> {
    console.log('Email service disabled: sendInvoiceApprovalConfirmation called');
  }

  async sendInvoiceWithdrawnNotification(
    invoiceId: string,
    mds: any[],
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    creatorName: string,
    withdrawnDate: string,
    withdrawnTime: string
  ): Promise<void> {
    console.log('Email service disabled: sendInvoiceWithdrawnNotification called');
  }
}

export default new EmailService();
