"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const database_1 = require("../config/database");
const Activity_1 = require("../entities/Activity");
class ActivityService {
    static async log(params) {
        const activity = this.activityRepo.create({
            user_id: params.userId,
            type: params.type,
            description: params.description,
            entity_type: params.entityType,
            entity_id: params.entityId,
            module: params.module,
            details: params.details,
        });
        return await this.activityRepo.save(activity);
    }
    static async logInvoiceUpdate(userId, originalInvoice, updatedFields, updatedInvoice) {
        const changes = [];
        // Check amount change
        if (originalInvoice.amount !== updatedFields.amount) {
            changes.push(`Amount changed from RM${originalInvoice.amount} to RM${updatedFields.amount}`);
            await this.log({
                userId,
                type: Activity_1.ActivityType.INVOICE_AMOUNT_CHANGE,
                description: `Invoice ${originalInvoice.invoice_number} amount changed`,
                entityType: 'invoice',
                entityId: originalInvoice.id,
                module: 'finance',
                details: JSON.stringify({
                    invoiceNumber: originalInvoice.invoice_number,
                    from: originalInvoice.amount,
                    to: updatedFields.amount,
                }),
            });
        }
        // Check status change
        if (originalInvoice.status !== updatedFields.status) {
            changes.push(`Status changed from ${originalInvoice.status} to ${updatedFields.status}`);
            await this.log({
                userId,
                type: Activity_1.ActivityType.INVOICE_STATUS_CHANGE,
                description: `Invoice ${originalInvoice.invoice_number} status changed`,
                entityType: 'invoice',
                entityId: originalInvoice.id,
                module: 'finance',
                details: JSON.stringify({
                    invoiceNumber: originalInvoice.invoice_number,
                    from: originalInvoice.status,
                    to: updatedFields.status,
                }),
            });
        }
        // Log general update if no specific changes caught
        if (changes.length === 0) {
            await this.log({
                userId,
                type: Activity_1.ActivityType.INVOICE_UPDATE,
                description: `Invoice ${originalInvoice.invoice_number} updated`,
                entityType: 'invoice',
                entityId: originalInvoice.id,
                module: 'finance',
                details: JSON.stringify({
                    invoiceNumber: originalInvoice.invoice_number,
                    updatedFields: Object.keys(updatedFields),
                }),
            });
        }
    }
    static async logInvoiceCreate(userId, invoice) {
        await this.log({
            userId,
            type: Activity_1.ActivityType.INVOICE_CREATE,
            description: `Invoice ${invoice.invoice_number} created for project ${invoice.project_code}`,
            entityType: 'invoice',
            entityId: invoice.id,
            module: 'finance',
            details: JSON.stringify({
                invoiceNumber: invoice.invoice_number,
                projectCode: invoice.project_code,
                amount: invoice.amount,
                status: invoice.status,
            }),
        });
    }
}
exports.ActivityService = ActivityService;
ActivityService.activityRepo = database_1.AppDataSource.getRepository(Activity_1.Activity);
//# sourceMappingURL=activity.service.js.map