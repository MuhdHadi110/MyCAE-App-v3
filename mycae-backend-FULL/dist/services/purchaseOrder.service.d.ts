import { PurchaseOrder, POStatus } from '../entities/PurchaseOrder';
export declare class PurchaseOrderService {
    private _poRepo;
    private get poRepo();
    /**
     * Create a new revision of an existing PO
     */
    createRevision(originalPOId: string, newData: {
        amount: number;
        currency: string;
        receivedDate: Date;
        description?: string;
        fileUrl?: string;
        revisionReason: string;
    }, userId: string): Promise<PurchaseOrder>;
    /**
     * Get all revisions for a PO number
     */
    getRevisionHistory(poNumberBase: string): Promise<PurchaseOrder[]>;
    /**
     * Get active revision for a PO number base
     */
    getActiveRevision(poNumberBase: string): Promise<PurchaseOrder | null>;
    /**
     * Check if project already has an active PO
     * Returns the active PO if found, null otherwise
     */
    getActivePOByProjectCode(projectCode: string): Promise<PurchaseOrder | null>;
    /**
     * Manually adjust MYR amount (for fees, taxes, etc.)
     */
    adjustMYRAmount(poId: string, adjustedAmount: number, reason: string, userId: string): Promise<PurchaseOrder>;
    /**
     * Get all active POs (default query for analytics)
     */
    getAllActivePOs(filters?: {
        project_code?: string;
        status?: POStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: PurchaseOrder[];
        total: number;
    }>;
    /**
     * Get PO by ID
     */
    getById(id: string): Promise<PurchaseOrder | null>;
    /**
     * Create new PO
     */
    createPO(data: {
        poNumber: string;
        projectCode: string;
        clientName: string;
        amount: number;
        currency?: string;
        receivedDate: Date;
        dueDate?: Date;
        description?: string;
        status?: POStatus;
        fileUrl?: string;
        plannedHours?: number;
        customExchangeRate?: number;
    }): Promise<PurchaseOrder>;
    /**
     * Update PO
     */
    updatePO(id: string, updates: any): Promise<PurchaseOrder>;
    /**
     * Delete PO
     */
    deletePO(id: string): Promise<void>;
    /**
     * Calculate total revenue for project (active POs only)
     */
    calculateProjectRevenue(projectCode: string): Promise<number>;
}
//# sourceMappingURL=purchaseOrder.service.d.ts.map