"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIssuedPOsTable1763025100000 = void 0;
const typeorm_1 = require("typeorm");
class CreateIssuedPOsTable1763025100000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'issued_pos',
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
                    name: 'items',
                    type: 'text',
                },
                {
                    name: 'recipient',
                    type: 'varchar',
                    length: '200',
                },
                {
                    name: 'project_code',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 15,
                    scale: 2,
                },
                {
                    name: 'issue_date',
                    type: 'datetime',
                },
                {
                    name: 'due_date',
                    type: 'datetime',
                    isNullable: true,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['issued', 'received', 'completed'],
                    default: "'issued'",
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
        // No FK constraint for project_code as it's optional
    }
    async down(queryRunner) {
        await queryRunner.dropTable('issued_pos');
    }
}
exports.CreateIssuedPOsTable1763025100000 = CreateIssuedPOsTable1763025100000;
//# sourceMappingURL=1763025100000-CreateIssuedPOsTable.js.map