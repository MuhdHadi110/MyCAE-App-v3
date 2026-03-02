import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Migration to add Structure Container support
 * This allows projects to be divided into multiple structures with separate POs
 * while maintaining backward compatibility with existing Variation Orders
 */
export declare class AddStructureContainerSupport1770900000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1770900000000-AddStructureContainerSupport.d.ts.map