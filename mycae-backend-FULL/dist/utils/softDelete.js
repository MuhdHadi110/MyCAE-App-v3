"use strict";
/**
 * Soft Delete Utilities
 * Provides helper functions for soft deleting entities and querying with soft delete support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteEntity = softDeleteEntity;
exports.hardDeleteEntity = hardDeleteEntity;
exports.restoreEntity = restoreEntity;
exports.excludeSoftDeleted = excludeSoftDeleted;
exports.includeSoftDeleted = includeSoftDeleted;
exports.onlySoftDeleted = onlySoftDeleted;
/**
 * Mark an entity as deleted (soft delete)
 * @param repository The entity repository
 * @param id The entity ID
 * @param deletedBy Optional user who deleted the entity
 */
async function softDeleteEntity(repository, id, deletedBy) {
    const entity = await repository.findOne({ where: { id } });
    if (!entity) {
        throw new Error(`Entity with ID ${id} not found`);
    }
    entity.deletedAt = new Date();
    if (deletedBy) {
        entity.deletedBy = deletedBy;
    }
    await repository.save(entity);
}
/**
 * Permanently delete an entity (hard delete)
 * Use with caution - data cannot be recovered
 * @param repository The entity repository
 * @param id The entity ID
 */
async function hardDeleteEntity(repository, id) {
    await repository.remove(await repository.findOneOrFail({ where: { id } }));
}
/**
 * Restore a soft-deleted entity
 * @param repository The entity repository
 * @param id The entity ID
 */
async function restoreEntity(repository, id) {
    const entity = await repository.findOne({
        where: { id },
        withDeleted: true,
    });
    if (!entity) {
        throw new Error(`Entity with ID ${id} not found`);
    }
    if (!entity.deletedAt) {
        throw new Error(`Entity with ID ${id} is not deleted`);
    }
    entity.deletedAt = undefined;
    entity.deletedBy = undefined;
    return repository.save(entity);
}
/**
 * Query builder extension to automatically exclude soft-deleted records
 * @param queryBuilder The query builder instance
 * @param alias The entity alias
 */
function excludeSoftDeleted(queryBuilder, alias = 'entity') {
    return queryBuilder.andWhere(`${alias}.deletedAt IS NULL`);
}
/**
 * Query builder extension to include soft-deleted records
 * @param queryBuilder The query builder instance
 */
function includeSoftDeleted(queryBuilder) {
    // TypeORM's withDeleted is handled at the repository level
    // This is a placeholder for consistency
    return queryBuilder;
}
/**
 * Query builder to get only soft-deleted records
 * @param queryBuilder The query builder instance
 * @param alias The entity alias
 */
function onlySoftDeleted(queryBuilder, alias = 'entity') {
    return queryBuilder.andWhere(`${alias}.deletedAt IS NOT NULL`);
}
//# sourceMappingURL=softDelete.js.map