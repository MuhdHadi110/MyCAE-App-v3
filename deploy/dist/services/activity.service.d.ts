import { Activity, ActivityType } from '../entities/Activity';
import { Invoice } from '../entities/Invoice';
interface LogActivityParams {
    userId: string;
    type: ActivityType;
    description: string;
    entityType?: string;
    entityId?: string;
    module?: string;
    details?: string;
}
export declare class ActivityService {
    private static activityRepo;
    static log(params: LogActivityParams): Promise<Activity>;
    static logInvoiceUpdate(userId: string, originalInvoice: Invoice, updatedFields: Partial<Invoice>, updatedInvoice: Invoice): Promise<void>;
    static logInvoiceCreate(userId: string, invoice: Invoice): Promise<void>;
}
export {};
//# sourceMappingURL=activity.service.d.ts.map