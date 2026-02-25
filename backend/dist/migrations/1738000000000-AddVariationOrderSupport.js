"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVariationOrderSupport1738000000000 = void 0;
const typeorm_1 = require("typeorm");
class AddVariationOrderSupport1738000000000 {
    async up(queryRunner) {
        // 1. Add parent_project_id column (self-referential FK)
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'parent_project_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
        }));
        // 2. Add is_variation_order flag for easy filtering
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'is_variation_order',
            type: 'boolean',
            default: false,
            isNullable: false,
        }));
        // 3. Add vo_number for tracking sequence (1, 2, 3, etc.)
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'vo_number',
            type: 'int',
            isNullable: true,
        }));
        // 4. Create index for parent lookups
        await queryRunner.createIndex('projects', new typeorm_1.TableIndex({
            name: 'IDX_parent_project_id',
            columnNames: ['parent_project_id'],
        }));
        // 5. Create composite index for VO queries
        await queryRunner.createIndex('projects', new typeorm_1.TableIndex({
            name: 'IDX_parent_vo',
            columnNames: ['parent_project_id', 'is_variation_order', 'vo_number'],
        }));
        // 6. Add self-referential foreign key
        await queryRunner.createForeignKey('projects', new typeorm_1.TableForeignKey({
            name: 'FK_project_parent',
            columnNames: ['parent_project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT', // Prevent deleting parent if VOs exist
        }));
    }
    async down(queryRunner) {
        // Drop in reverse order
        await queryRunner.dropForeignKey('projects', 'FK_project_parent');
        await queryRunner.dropIndex('projects', 'IDX_parent_vo');
        await queryRunner.dropIndex('projects', 'IDX_parent_project_id');
        await queryRunner.dropColumn('projects', 'vo_number');
        await queryRunner.dropColumn('projects', 'is_variation_order');
        await queryRunner.dropColumn('projects', 'parent_project_id');
    }
}
exports.AddVariationOrderSupport1738000000000 = AddVariationOrderSupport1738000000000;
//# sourceMappingURL=1738000000000-AddVariationOrderSupport.js.map