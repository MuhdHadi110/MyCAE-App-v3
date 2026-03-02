"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePurchaseOrdersTable1763021810008 = void 0;
const typeorm_1 = require("typeorm");
class CreatePurchaseOrdersTable1763021810008 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'purchase_orders',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'po_number',
                    type: 'varchar',
                    length: '100',
                    isUnique: true,
                },
                {
                    name: 'project_code',
                    type: 'varchar',
                    length: '50',
                },
                {
                    name: 'client_name',
                    type: 'varchar',
                    length: '500',
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 15,
                    scale: 2,
                },
                {
                    name: 'received_date',
                    type: 'datetime',
                },
                {
                    name: 'due_date',
                    type: 'datetime',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['received', 'in-progress', 'invoiced', 'paid'],
                    default: "'received'",
                },
                {
                    name: 'file_url',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        // Add foreign key to projects table
        await queryRunner.createForeignKey('purchase_orders', new typeorm_1.TableForeignKey({
            columnNames: ['project_code'],
            referencedColumnNames: ['project_code'],
            referencedTableName: 'projects',
            onDelete: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('purchase_orders');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('project_code') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('purchase_orders', foreignKey);
            }
        }
        await queryRunner.dropTable('purchase_orders');
    }
}
exports.CreatePurchaseOrdersTable1763021810008 = CreatePurchaseOrdersTable1763021810008;
//# sourceMappingURL=1763021810008-CreatePurchaseOrdersTable.js.map