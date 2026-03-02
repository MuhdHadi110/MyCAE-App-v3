"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScheduledMaintenance1735800000000 = void 0;
const typeorm_1 = require("typeorm");
class AddScheduledMaintenance1735800000000 {
    async up(queryRunner) {
        // Create scheduled_maintenance table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'scheduled_maintenance',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'item_id',
                    type: 'varchar',
                    length: '36',
                },
                {
                    name: 'maintenance_type',
                    type: 'enum',
                    enum: ['calibration', 'inspection', 'servicing', 'replacement', 'other'],
                    default: "'other'",
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'scheduled_date',
                    type: 'date',
                },
                {
                    name: 'is_completed',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'completed_date',
                    type: 'date',
                    isNullable: true,
                },
                {
                    name: 'completed_by',
                    type: 'varchar',
                    length: '36',
                    isNullable: true,
                },
                {
                    name: 'ticket_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: true,
                },
                {
                    name: 'reminder_14_sent',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'reminder_7_sent',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'reminder_1_sent',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'inventory_action',
                    type: 'enum',
                    enum: ['deduct', 'status-only', 'none'],
                    default: "'none'",
                },
                {
                    name: 'quantity_affected',
                    type: 'int',
                    default: 1,
                },
                {
                    name: 'created_by',
                    type: 'varchar',
                    length: '36',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        // Add foreign key for item_id -> inventory
        await queryRunner.createForeignKey('scheduled_maintenance', new typeorm_1.TableForeignKey({
            columnNames: ['item_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'inventory',
            onDelete: 'CASCADE',
        }));
        // Add foreign key for completed_by -> users
        await queryRunner.createForeignKey('scheduled_maintenance', new typeorm_1.TableForeignKey({
            columnNames: ['completed_by'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
        // Add foreign key for created_by -> users
        await queryRunner.createForeignKey('scheduled_maintenance', new typeorm_1.TableForeignKey({
            columnNames: ['created_by'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
        // Add columns to inventory table
        await queryRunner.addColumns('inventory', [
            new typeorm_1.TableColumn({
                name: 'next_maintenance_date',
                type: 'date',
                isNullable: true,
            }),
            new typeorm_1.TableColumn({
                name: 'in_maintenance_quantity',
                type: 'int',
                default: 0,
            }),
        ]);
        // Add columns to maintenance_tickets table
        await queryRunner.addColumns('maintenance_tickets', [
            new typeorm_1.TableColumn({
                name: 'scheduled_maintenance_id',
                type: 'varchar',
                length: '36',
                isNullable: true,
            }),
            new typeorm_1.TableColumn({
                name: 'inventory_action',
                type: 'enum',
                enum: ['deduct', 'status-only', 'none'],
                isNullable: true,
            }),
            new typeorm_1.TableColumn({
                name: 'quantity_deducted',
                type: 'int',
                default: 0,
            }),
            new typeorm_1.TableColumn({
                name: 'inventory_restored',
                type: 'boolean',
                default: false,
            }),
        ]);
        // Add foreign key for scheduled_maintenance_id -> scheduled_maintenance
        await queryRunner.createForeignKey('maintenance_tickets', new typeorm_1.TableForeignKey({
            columnNames: ['scheduled_maintenance_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'scheduled_maintenance',
            onDelete: 'SET NULL',
        }));
        // Update inventory status enum to include 'in-maintenance'
        // Note: MySQL requires recreating the column to modify enum values
        await queryRunner.query(`
      ALTER TABLE inventory
      MODIFY COLUMN status ENUM('available', 'low-stock', 'out-of-stock', 'in-maintenance', 'discontinued')
      DEFAULT 'available'
    `);
    }
    async down(queryRunner) {
        // Remove foreign key from maintenance_tickets
        const ticketsTable = await queryRunner.getTable('maintenance_tickets');
        const scheduledFk = ticketsTable?.foreignKeys.find(fk => fk.columnNames.indexOf('scheduled_maintenance_id') !== -1);
        if (scheduledFk) {
            await queryRunner.dropForeignKey('maintenance_tickets', scheduledFk);
        }
        // Remove columns from maintenance_tickets
        await queryRunner.dropColumns('maintenance_tickets', [
            'scheduled_maintenance_id',
            'inventory_action',
            'quantity_deducted',
            'inventory_restored',
        ]);
        // Remove columns from inventory
        await queryRunner.dropColumns('inventory', [
            'next_maintenance_date',
            'in_maintenance_quantity',
        ]);
        // Revert inventory status enum
        await queryRunner.query(`
      ALTER TABLE inventory
      MODIFY COLUMN status ENUM('available', 'low-stock', 'out-of-stock', 'discontinued')
      DEFAULT 'available'
    `);
        // Drop scheduled_maintenance table (foreign keys are dropped automatically with CASCADE)
        await queryRunner.dropTable('scheduled_maintenance');
    }
}
exports.AddScheduledMaintenance1735800000000 = AddScheduledMaintenance1735800000000;
//# sourceMappingURL=1735800000000-AddScheduledMaintenance.js.map