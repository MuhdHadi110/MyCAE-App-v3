export declare class Client {
    id: string;
    name: string;
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    industry?: string;
    website?: string;
    notes?: string;
    categories?: string[];
    status: 'active' | 'inactive' | 'archived';
    createdDate: Date;
    lastUpdated: Date;
    activeProjects: number;
    totalProjects: number;
    generateId(): void;
}
//# sourceMappingURL=Client.d.ts.map