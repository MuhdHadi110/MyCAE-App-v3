"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class N8nService {
    constructor() {
        this.apiKey = process.env.N8N_API_KEY || '';
        this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
    }
    /**
     * Send data to n8n webhook
     */
    async sendToWebhook(webhookUrl, payload) {
        try {
            if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
                console.log('⚠️ n8n webhook not configured, skipping automation');
                return;
            }
            await axios_1.default.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
                },
                timeout: 5000,
            });
            console.log(`✅ n8n webhook triggered: ${payload.event}`);
        }
        catch (error) {
            console.error(`❌ n8n webhook failed for ${payload.event}:`, error.message);
            // Don't throw error - automation failures shouldn't break main app flow
        }
    }
    /**
     * Trigger when new checkout is created
     */
    async onCheckoutCreated(checkoutData) {
        await this.sendToWebhook(process.env.N8N_WORKFLOW_NEW_CHECKOUT || '', {
            event: 'checkout.created',
            data: checkoutData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Trigger when checkout return is due
     */
    async onReturnDue(checkoutData) {
        await this.sendToWebhook(process.env.N8N_WORKFLOW_RETURN_DUE || '', {
            event: 'checkout.return_due',
            data: checkoutData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Trigger when inventory stock is low
     */
    async onLowStockAlert(inventoryData) {
        await this.sendToWebhook(process.env.N8N_WORKFLOW_LOW_STOCK || '', {
            event: 'inventory.low_stock',
            data: inventoryData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Trigger when maintenance ticket is created
     */
    async onMaintenanceTicketCreated(ticketData) {
        await this.sendToWebhook(process.env.N8N_WORKFLOW_MAINTENANCE_TICKET || '', {
            event: 'maintenance.ticket_created',
            data: ticketData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Trigger when project is assigned
     */
    async onProjectAssigned(projectData) {
        await this.sendToWebhook(process.env.N8N_WORKFLOW_PROJECT_ASSIGNED || '', {
            event: 'project.assigned',
            data: projectData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Generic webhook trigger for custom workflows
     */
    async triggerCustomWorkflow(workflowUrl, event, data) {
        await this.sendToWebhook(workflowUrl, {
            event,
            data,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.default = new N8nService();
//# sourceMappingURL=n8n.service.js.map