/**
 * Base Entity with common fields for all entities
 * Includes audit fields, timestamps, and soft delete support
 */
export declare abstract class BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
    generateId(): void;
}
//# sourceMappingURL=BaseEntity.d.ts.map