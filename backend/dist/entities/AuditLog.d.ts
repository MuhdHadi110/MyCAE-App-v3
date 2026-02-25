import { User } from './User';
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view",
    EXPORT = "export",
    APPROVE = "approve",
    REJECT = "reject"
}
export declare enum AuditEntityType {
    INVOICE = "invoice",
    ISSUED_PO = "issued_po",
    RECEIVED_PO = "received_po",
    PROJECT = "project",
    PAYMENT = "payment",
    EXCHANGE_RATE = "exchange_rate"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    entity_type: AuditEntityType;
    entity_id: string;
    user_id: string | null;
    user?: User;
    user_name: string | null;
    user_email: string | null;
    description: string | null;
    changes: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    } | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
}
//# sourceMappingURL=AuditLog.d.ts.map