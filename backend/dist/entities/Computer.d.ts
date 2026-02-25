import { User } from './User';
export declare enum ComputerType {
    DESKTOP = "desktop",
    LAPTOP = "laptop",
    TABLET = "tablet",
    WORKSTATION = "workstation"
}
export declare enum ComputerStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    IN_REPAIR = "in-repair",
    DECOMMISSIONED = "decommissioned"
}
export declare class Computer {
    id: string;
    asset_tag: string;
    device_name: string;
    computer_type: ComputerType;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    assigned_to?: string;
    assignee?: User;
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    os?: string;
    os_version?: string;
    status: ComputerStatus;
    purchase_cost?: number;
    purchase_date?: Date;
    warranty_expiry?: Date;
    decommission_date?: Date;
    location?: string;
    installed_software?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Computer.d.ts.map