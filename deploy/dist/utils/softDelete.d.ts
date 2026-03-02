/**
 * Soft Delete Utilities
 * Provides helper functions for soft deleting entities and querying with soft delete support
 */
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
/**
 * Mark an entity as deleted (soft delete)
 * @param repository The entity repository
 * @param id The entity ID
 * @param deletedBy Optional user who deleted the entity
 */
export declare function softDeleteEntity<T extends {
    id: string;
    deletedAt?: Date;
    deletedBy?: string;
}>(repository: Repository<T>, id: string, deletedBy?: string): Promise<void>;
/**
 * Permanently delete an entity (hard delete)
 * Use with caution - data cannot be recovered
 * @param repository The entity repository
 * @param id The entity ID
 */
export declare function hardDeleteEntity<T extends {
    id: string;
}>(repository: Repository<T>, id: string): Promise<void>;
/**
 * Restore a soft-deleted entity
 * @param repository The entity repository
 * @param id The entity ID
 */
export declare function restoreEntity<T extends {
    id: string;
    deletedAt?: Date;
    deletedBy?: string;
}>(repository: Repository<T>, id: string): Promise<T>;
/**
 * Query builder extension to automatically exclude soft-deleted records
 * @param queryBuilder The query builder instance
 * @param alias The entity alias
 */
export declare function excludeSoftDeleted<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, alias?: string): SelectQueryBuilder<T>;
/**
 * Query builder extension to include soft-deleted records
 * @param queryBuilder The query builder instance
 */
export declare function includeSoftDeleted<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T>;
/**
 * Query builder to get only soft-deleted records
 * @param queryBuilder The query builder instance
 * @param alias The entity alias
 */
export declare function onlySoftDeleted<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, alias?: string): SelectQueryBuilder<T>;
//# sourceMappingURL=softDelete.d.ts.map