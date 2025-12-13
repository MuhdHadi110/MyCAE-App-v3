import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * n8n Automation Service
 *
 * This service integrates with n8n workflows for automation.
 * n8n is a free, open-source workflow automation tool that can run on your iCore hosting.
 *
 * Setup Instructions:
 * 1. Install n8n on your server or use n8n.cloud
 * 2. Create webhooks in n8n for each automation workflow
 * 3. Add webhook URLs to .env file
 * 4. Configure workflows in n8n dashboard
 */

interface N8nWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

class N8nService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.N8N_API_KEY || '';
    this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
  }

  /**
   * Send data to n8n webhook
   */
  private async sendToWebhook(webhookUrl: string, payload: N8nWebhookPayload): Promise<void> {
    try {
      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        console.log('⚠️ n8n webhook not configured, skipping automation');
        return;
      }

      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
        },
        timeout: 5000,
      });

      console.log(`✅ n8n webhook triggered: ${payload.event}`);
    } catch (error: any) {
      console.error(`❌ n8n webhook failed for ${payload.event}:`, error.message);
      // Don't throw error - automation failures shouldn't break main app flow
    }
  }

  /**
   * Trigger when new checkout is created
   */
  async onCheckoutCreated(checkoutData: any): Promise<void> {
    await this.sendToWebhook(
      process.env.N8N_WORKFLOW_NEW_CHECKOUT || '',
      {
        event: 'checkout.created',
        data: checkoutData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Trigger when checkout return is due
   */
  async onReturnDue(checkoutData: any): Promise<void> {
    await this.sendToWebhook(
      process.env.N8N_WORKFLOW_RETURN_DUE || '',
      {
        event: 'checkout.return_due',
        data: checkoutData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Trigger when inventory stock is low
   */
  async onLowStockAlert(inventoryData: any): Promise<void> {
    await this.sendToWebhook(
      process.env.N8N_WORKFLOW_LOW_STOCK || '',
      {
        event: 'inventory.low_stock',
        data: inventoryData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Trigger when maintenance ticket is created
   */
  async onMaintenanceTicketCreated(ticketData: any): Promise<void> {
    await this.sendToWebhook(
      process.env.N8N_WORKFLOW_MAINTENANCE_TICKET || '',
      {
        event: 'maintenance.ticket_created',
        data: ticketData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Trigger when project is assigned
   */
  async onProjectAssigned(projectData: any): Promise<void> {
    await this.sendToWebhook(
      process.env.N8N_WORKFLOW_PROJECT_ASSIGNED || '',
      {
        event: 'project.assigned',
        data: projectData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Generic webhook trigger for custom workflows
   */
  async triggerCustomWorkflow(workflowUrl: string, event: string, data: any): Promise<void> {
    await this.sendToWebhook(workflowUrl, {
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

export default new N8nService();
