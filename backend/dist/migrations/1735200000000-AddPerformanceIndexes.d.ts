import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Migration to add performance indexes on frequently queried columns
 * This improves query performance for common operations
 */
export declare class AddPerformanceIndexes1735200000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1735200000000-AddPerformanceIndexes.d.ts.map