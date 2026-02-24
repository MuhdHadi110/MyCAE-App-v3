import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

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

    // Verify SMTP connection on startup
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP Server connection verified');
    } catch (error: any) {
      logger.error('SMTP Connection Error', { error: error.message });
      logger.warn('Email notifications will not work until SMTP is configured');
    }
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
      logger.debug('Email sent successfully', { recipient: to, subject });
    } catch (error: any) {
      logger.error('Failed to send email', { recipient: to, error: error.message });
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
    const supportEmail = process.env.SUPPORT_EMAIL || 'noreply@mycaetech.com';

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
    const supportEmail = process.env.SUPPORT_EMAIL || 'noreply@mycaetech.com';

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
    const supportEmail = process.env.SUPPORT_EMAIL || 'noreply@mycaetech.com';

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
    const supportEmail = process.env.SUPPORT_EMAIL || 'noreply@mycaetech.com';

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
    const supportEmail = process.env.SUPPORT_EMAIL || 'noreply@mycaetech.com';
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
    const subject = `Invoice Approval Required: ${invoiceNumber} - ${currency} ${invoiceAmount.toLocaleString()}`;
    const approvalUrl = `${process.env.FRONTEND_URL}/finance/invoices/${invoiceId}`;

    // Send to all MDs
    for (const md of mds) {
      try {
        const personalizedHtml = this.getInvoiceApprovalRequestTemplate(
          invoiceNumber,
          invoiceAmount,
          currency,
          projectCode,
          projectName,
          creatorName,
          creatorEmail,
          submittedDate,
          submittedTime,
          approvalUrl,
          md.name
        );
        await this.sendEmail(md.email, subject, personalizedHtml);
        logger.debug('Invoice approval email sent', { recipient: md.name, email: md.email });
      } catch (error: any) {
        logger.error('Failed to send invoice approval email', { recipient: md.name, error: error.message });
      }
    }
  }

  /**
   * Send PO received notification to Managing Directors
   */
  async sendPOReceivedNotification(
    poId: string,
    mds: any[],
    poNumber: string,
    poAmount: number,
    currency: string,
    projectCode: string,
    clientName: string,
    creatorName: string,
    creatorEmail: string,
    receivedDate: string,
    receivedTime: string
  ): Promise<void> {
    const subject = `New PO Received: ${poNumber} - ${currency} ${poAmount.toLocaleString()}`;
    const poUrl = `${process.env.FRONTEND_URL}/finance/purchase-orders`;

    // Send to all MDs
    for (const md of mds) {
      try {
        const personalizedHtml = this.getPOReceivedNotificationTemplate(
          poNumber,
          poAmount,
          currency,
          projectCode,
          clientName,
          creatorName,
          creatorEmail,
          receivedDate,
          receivedTime,
          poUrl,
          md.name
        );
        await this.sendEmail(md.email, subject, personalizedHtml);
        logger.debug('PO notification sent', { recipient: md.name, email: md.email });
      } catch (error: any) {
        logger.error('Failed to send PO notification', { recipient: md.name, error: error.message });
      }
    }
  }

  /**
   * PO received notification email template
   */
  private getPOReceivedNotificationTemplate(
    poNumber: string,
    poAmount: number,
    currency: string,
    projectCode: string,
    clientName: string,
    creatorName: string,
    creatorEmail: string,
    receivedDate: string,
    receivedTime: string,
    poUrl: string,
    mdName: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${mdName},</p>

    <p>A new Purchase Order has been received and added to the system.</p>

    <p style="margin: 20px 0;">
      <strong>PO Details:</strong><br>
      PO Number : ${poNumber}<br>
      Amount : ${currency} ${poAmount.toLocaleString()}<br>
      Project Code : ${projectCode}<br>
      Client Name : ${clientName}<br>
      Added By : ${creatorName}<br>
      Received On : ${receivedDate} at ${receivedTime}
    </p>

    <p>This PO has been added to the finance tracking system.</p>

    <p style="margin: 20px 0;">
      <a href="${poUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 4px;">View Purchase Orders</a>
    </p>

    <p>Should you have any questions, please contact ${creatorName} at ${creatorEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Tracker System
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Invoice approval request email template - Clean professional format
   */
  private getInvoiceApprovalRequestTemplate(
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    creatorName: string,
    creatorEmail: string,
    submittedDate: string,
    submittedTime: string,
    approvalUrl: string,
    mdName: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${mdName},</p>

    <p>An invoice has been submitted and requires your approval.</p>

    <p style="margin: 20px 0;">
      Invoice Number : ${invoiceNumber}<br>
      Amount : ${currency} ${invoiceAmount.toLocaleString()}<br>
      Project Code : ${projectCode}<br>
      Project Name : ${projectName}<br>
      Submitted By : ${creatorName}<br>
      Submitted On : ${submittedDate} at ${submittedTime}
    </p>

    <p>Please review and approve this invoice at your earliest convenience.</p>

    <p style="margin: 20px 0;">
      <a href="${approvalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 4px;">Review Invoice</a>
    </p>

    <p>Should you have any questions, please contact ${creatorName} at ${creatorEmail}.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
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
    const subject = `Invoice Approved: ${invoiceNumber} - ${currency} ${invoiceAmount.toLocaleString()}`;
    const invoiceUrl = `${process.env.FRONTEND_URL}/finance/invoices/${invoiceId}`;

    const html = this.getInvoiceApprovalConfirmationTemplate(
      creatorName,
      invoiceNumber,
      invoiceAmount,
      currency,
      projectCode,
      projectName,
      approverName,
      approvedDate,
      approvedTime,
      invoiceUrl
    );

    await this.sendEmail(creatorEmail, subject, html);
    logger.debug('Invoice approval confirmation sent', { recipient: creatorName, email: creatorEmail });
  }

  /**
   * Invoice approval confirmation email template - Clean professional format
   */
  private getInvoiceApprovalConfirmationTemplate(
    creatorName: string,
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    approverName: string,
    approvedDate: string,
    approvedTime: string,
    invoiceUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${creatorName},</p>

    <p>Your invoice has been <strong>approved</strong>.</p>

    <p style="margin: 20px 0;">
      Invoice Number : ${invoiceNumber}<br>
      Amount : ${currency} ${invoiceAmount.toLocaleString()}<br>
      Project Code : ${projectCode}<br>
      Project Name : ${projectName}<br>
      Approved By : ${approverName}<br>
      Approved On : ${approvedDate} at ${approvedTime}
    </p>

    <p>You can now proceed with the next steps for this invoice.</p>

    <p style="margin: 20px 0;">
      <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 4px;">View Invoice</a>
    </p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      MyCAE Admin.
    </p>
  </div>
</body>
</html>
    `;
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
    const subject = `Invoice Withdrawn: ${invoiceNumber} - ${currency} ${invoiceAmount.toLocaleString()}`;

    // Send to all MDs
    for (const md of mds) {
      try {
        const personalizedHtml = this.getInvoiceWithdrawnTemplate(
          invoiceNumber,
          invoiceAmount,
          currency,
          projectCode,
          projectName,
          creatorName,
          withdrawnDate,
          withdrawnTime,
          md.name
        );
        await this.sendEmail(md.email, subject, personalizedHtml);
        logger.debug('Invoice withdrawn notification sent', { recipient: md.name, email: md.email });
      } catch (error: any) {
        logger.error('Failed to send invoice withdrawn notification', { recipient: md.name, error: error.message });
      }
    }
  }

  /**
   * Invoice withdrawn notification email template - Clean professional format
   */
  private getInvoiceWithdrawnTemplate(
    invoiceNumber: string,
    invoiceAmount: number,
    currency: string,
    projectCode: string,
    projectName: string,
    creatorName: string,
    withdrawnDate: string,
    withdrawnTime: string,
    mdName: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p>Dear ${mdName},</p>

    <p>An invoice approval request has been <strong>withdrawn</strong> by the creator.</p>

    <p style="margin: 20px 0;">
      Invoice Number : ${invoiceNumber}<br>
      Amount : ${currency} ${invoiceAmount.toLocaleString()}<br>
      Project Code : ${projectCode}<br>
      Project Name : ${projectName}<br>
      Withdrawn By : ${creatorName}<br>
      Withdrawn On : ${withdrawnDate} at ${withdrawnTime}
    </p>

    <p>No action is required. This is for your information only.</p>

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
   * Send welcome email to new user with temporary password and onboarding guide
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    tempPassword: string,
    expiryDate: Date,
    pdfBuffer: Buffer
  ): Promise<void> {
    const subject = 'MyCAE Technologies App - Your Login Details';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Plain text email body
    const textBody = `Hi ${userName},

Welcome to MyCAE Technologies App! Your account has been created.

LOGIN DETAILS:
Website: ${loginUrl}
Email: ${userEmail}
Temporary Password: ${tempPassword}

IMPORTANT INFORMATION:
- You must change your password on first login
- This password expires on ${formattedExpiryDate}
- See the attached Onboarding Guide for instructions

GETTING STARTED:
1. Go to ${loginUrl}
2. Enter your email and temporary password
3. Change your password when prompted
4. Review the attached PDF guide

Welcome to the team!

MyCAE Admin Team`;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: subject,
        text: textBody,
        attachments: [
          {
            filename: 'MyCAE-Onboarding-Guide.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      logger.info('Welcome email sent', { email: userEmail });
    } catch (error: any) {
      logger.error('Failed to send welcome email', { email: userEmail, error: error.message });
      throw error;
    }
  }
}

export default new EmailService();
