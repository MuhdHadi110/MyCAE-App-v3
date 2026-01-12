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
export async function softDeleteEntity<T extends { id: string; deletedAt?: Date; deletedBy?: string }>(
  repository: Repository<T>,
  id: string,
  deletedBy?: string
): Promise<void> {
  const entity = await repository.findOne({ where: { id } as any });

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
export async function hardDeleteEntity<T extends { id: string }>(
  repository: Repository<T>,
  id: string
): Promise<void> {
  await repository.remove(await repository.findOneOrFail({ where: { id } as any }));
}

/**
 * Restore a soft-deleted entity
 * @param repository The entity repository
 * @param id The entity ID
 */
export async function restoreEntity<T extends { id: string; deletedAt?: Date; deletedBy?: string }>(
  repository: Repository<T>,
  id: string
): Promise<T> {
  const entity = await repository.findOne({
    where: { id } as any,
    withDeleted: true,
  } as any);

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
export function excludeSoftDeleted<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string = 'entity'
): SelectQueryBuilder<T> {
  return queryBuilder.andWhere(`${alias}.deletedAt IS NULL`);
}

/**
 * Query builder extension to include soft-deleted records
 * @param queryBuilder The query builder instance
 */
export function includeSoftDeleted<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>
): SelectQueryBuilder<T> {
  // TypeORM's withDeleted is handled at the repository level
  // This is a placeholder for consistency
  return queryBuilder;
}

/**
 * Query builder to get only soft-deleted records
 * @param queryBuilder The query builder instance
 * @param alias The entity alias
 */
export function onlySoftDeleted<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string = 'entity'
): SelectQueryBuilder<T> {
  return queryBuilder.andWhere(`${alias}.deletedAt IS NOT NULL`);
}
