declare class N8nService {
    private apiKey;
    private baseUrl;
    constructor();
    /**
     * Send data to n8n webhook
     */
    private sendToWebhook;
    /**
     * Trigger when new checkout is created
     */
    onCheckoutCreated(checkoutData: any): Promise<void>;
    /**
     * Trigger when checkout return is due
     */
    onReturnDue(checkoutData: any): Promise<void>;
    /**
     * Trigger when inventory stock is low
     */
    onLowStockAlert(inventoryData: any): Promise<void>;
    /**
     * Trigger when maintenance ticket is created
     */
    onMaintenanceTicketCreated(ticketData: any): Promise<void>;
    /**
     * Trigger when project is assigned
     */
    onProjectAssigned(projectData: any): Promise<void>;
    /**
     * Generic webhook trigger for custom workflows
     */
    triggerCustomWorkflow(workflowUrl: string, event: string, data: any): Promise<void>;
}
declare const _default: N8nService;
export default _default;
//# sourceMappingURL=n8n.service.d.ts.map