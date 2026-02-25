"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuditLogsTable1736300000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateAuditLogsTable1736300000000 {
    constructor() {
        this.name = 'CreateAuditLogsTable1736300000000';
    }
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'audit_logs',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'action',
                    type: 'enum',
                    enum: ['create', 'update', 'delete', 'view', 'export', 'approve', 'reject'],
                },
                {
                    name: 'entity_type',
                    type: 'enum',
                    enum: ['invoice', 'issued_po', 'received_po', 'project', 'payment', 'exchange_rate'],
                },
                {
                    name: 'entity_id',
                    type: 'varchar',
                    length: '36',
                },
                {
                    name: 'user_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: true,
                },
                {
                    name: 'user_name',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'user_email',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'changes',
                    type: 'json',
                    isNullable: true,
                },
                {
                    name: 'ip_address',
                    type: 'varchar',
                    length: '45',
                    isNullable: true,
                },
                {
                    name: 'user_agent',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        // Add indexes for common queries
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'IDX_audit_logs_entity',
            columnNames: ['entity_type', 'entity_id'],
        }));
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'IDX_audit_logs_user',
            columnNames: ['user_id'],
        }));
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'IDX_audit_logs_created_at',
            columnNames: ['created_at'],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('audit_logs');
    }
}
exports.CreateAuditLogsTable1736300000000 = CreateAuditLogsTable1736300000000;
//# sourceMappingURL=1736300000000-CreateAuditLogsTable.js.map