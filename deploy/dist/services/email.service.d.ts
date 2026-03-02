declare class EmailService {
    private transporter;
    constructor();
    /**
     * Send email notification
     */
    sendEmail(to: string, subject: string, html: string): Promise<void>;
    /**
     * Send checkout notification
     */
    sendCheckoutNotification(userEmail: string, userName: string, itemDetails: string, expectedReturnDate: string): Promise<void>;
    /**
     * Send return reminder notification
     */
    sendReturnReminder(userEmail: string, userName: string, itemDetails: string, dueDate: string): Promise<void>;
    /**
     * Send low stock alert
     */
    sendLowStockAlert(adminEmail: string, itemName: string, currentStock: number, minStock: number): Promise<void>;
    /**
     * Send maintenance ticket notification
     */
    sendMaintenanceTicketNotification(assigneeEmail: string, assigneeName: string, ticketTitle: string, priority: string): Promise<void>;
    /**
     * Send project assignment notification
     */
    sendProjectAssignmentNotification(userEmail: string, userName: string, projectTitle: string, projectCode: string, role: string, companyName: string, contactName: string, contactEmail: string, managerName: string): Promise<void>;
    /**
     * Project assignment email template - Clean professional format
     */
    private getProjectAssignmentTemplate;
    /**
     * Send maintenance reminder notification
     */
    sendMaintenanceReminder(recipientEmail: string, recipientName: string, itemName: string, maintenanceType: string, scheduledDate: Date, timeframe: string): Promise<void>;
    /**
     * Send overdue maintenance alert
     */
    sendMaintenanceOverdueAlert(recipientEmail: string, recipientName: string, itemName: string, maintenanceType: string, scheduledDate: Date, daysOverdue: number): Promise<void>;
    /**
     * Send maintenance completed notification
     */
    sendMaintenanceCompletedNotification(recipientEmail: string, recipientName: string, itemName: string, maintenanceType: string, completedBy: string): Promise<void>;
    /**
     * Maintenance reminder email template - Clean professional format
     */
    private getMaintenanceReminderTemplate;
    /**
     * Maintenance overdue email template - Clean professional format
     */
    private getMaintenanceOverdueTemplate;
    /**
     * Generic email template - Clean professional format
     */
    private getEmailTemplate;
    private getPriorityColor;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<void>;
    /**
     * Send password reset confirmation email
     */
    sendPasswordResetConfirmation(userEmail: string, userName: string): Promise<void>;
    /**
     * Password reset email template - Clean professional format
     */
    private getPasswordResetTemplate;
    /**
     * Password reset confirmation email template - Clean professional format
     */
    private getPasswordResetConfirmationTemplate;
    sendInvoiceApprovalRequest(invoiceId: string, mds: any[], invoiceNumber: string, invoiceAmount: number, currency: string, projectCode: string, projectName: string, creatorName: string, creatorEmail: string, submittedDate: string, submittedTime: string): Promise<void>;
    sendInvoiceApprovalConfirmation(invoiceId: string, creatorEmail: string, creatorName: string, invoiceNumber: string, invoiceAmount: number, currency: string, projectCode: string, projectName: string, approverName: string, approvedDate: string, approvedTime: string): Promise<void>;
    sendInvoiceWithdrawnNotification(invoiceId: string, mds: any[], invoiceNumber: string, invoiceAmount: number, currency: string, projectCode: string, projectName: string, creatorName: string, withdrawnDate: string, withdrawnTime: string): Promise<void>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map