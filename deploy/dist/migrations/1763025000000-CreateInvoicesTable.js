"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoicesTable1763025000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateInvoicesTable1763025000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'invoices',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'invoice_number',
                    type: 'varchar',
                    length: '100',
                    isUnique: true,
                },
                {
                    name: 'project_code',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'project_name',
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
                    name: 'invoice_date',
                    type: 'datetime',
                },
                {
                    name: 'percentage_of_total',
                    type: 'decimal',
                    precision: 5,
                    scale: 2,
                },
                {
                    name: 'invoice_sequence',
                    type: 'int',
                },
                {
                    name: 'cumulative_percentage',
                    type: 'decimal',
                    precision: 5,
                    scale: 2,
                },
                {
                    name: 'remark',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['draft', 'sent', 'paid', 'overdue'],
                    default: "'draft'",
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
        // Add foreign key to projects table (optional, allows multiple project codes)
        // Note: We're not adding FK constraint because project_code can contain multiple codes like "J22006, J22007"
    }
    async down(queryRunner) {
        await queryRunner.dropTable('invoices');
    }
}
exports.CreateInvoicesTable1763025000000 = CreateInvoicesTable1763025000000;
//# sourceMappingURL=1763025000000-CreateInvoicesTable.js.map