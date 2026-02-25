"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMultiCurrencySupport1734268000000 = void 0;
const typeorm_1 = require("typeorm");
class AddMultiCurrencySupport1734268000000 {
    async up(queryRunner) {
        // Create exchange_rates table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'exchange_rates',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'fromCurrency',
                    type: 'varchar',
                    length: '3',
                },
                {
                    name: 'toCurrency',
                    type: 'varchar',
                    length: '3',
                    default: "'MYR'",
                },
                {
                    name: 'rate',
                    type: 'decimal',
                    precision: 10,
                    scale: 6,
                },
                {
                    name: 'effectiveDate',
                    type: 'date',
                },
                {
                    name: 'source',
                    type: 'enum',
                    enum: ['manual', 'api'],
                    default: "'manual'",
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        // Add currency columns to purchase_orders
        await queryRunner.addColumn('purchase_orders', new typeorm_1.TableColumn({
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'MYR'",
        }));
        await queryRunner.addColumn('purchase_orders', new typeorm_1.TableColumn({
            name: 'amount_myr',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
        }));
        await queryRunner.addColumn('purchase_orders', new typeorm_1.TableColumn({
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
        }));
        // Add currency columns to issued_pos
        await queryRunner.addColumn('issued_pos', new typeorm_1.TableColumn({
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'MYR'",
        }));
        await queryRunner.addColumn('issued_pos', new typeorm_1.TableColumn({
            name: 'amount_myr',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
        }));
        await queryRunner.addColumn('issued_pos', new typeorm_1.TableColumn({
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
        }));
        // Add currency columns to invoices
        await queryRunner.addColumn('invoices', new typeorm_1.TableColumn({
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'MYR'",
        }));
        await queryRunner.addColumn('invoices', new typeorm_1.TableColumn({
            name: 'amount_myr',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
        }));
        await queryRunner.addColumn('invoices', new typeorm_1.TableColumn({
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
        }));
        // Backfill existing records with MYR and copy amount to amount_myr
        await queryRunner.query(`UPDATE purchase_orders SET currency = 'MYR', amount_myr = amount, exchange_rate = 1.0 WHERE currency IS NULL OR amount_myr IS NULL`);
        await queryRunner.query(`UPDATE issued_pos SET currency = 'MYR', amount_myr = amount, exchange_rate = 1.0 WHERE currency IS NULL OR amount_myr IS NULL`);
        await queryRunner.query(`UPDATE invoices SET currency = 'MYR', amount_myr = amount, exchange_rate = 1.0 WHERE currency IS NULL OR amount_myr IS NULL`);
    }
    async down(queryRunner) {
        // Drop exchange_rates table
        await queryRunner.dropTable('exchange_rates');
        // Remove currency columns from purchase_orders
        await queryRunner.dropColumn('purchase_orders', 'currency');
        await queryRunner.dropColumn('purchase_orders', 'amount_myr');
        await queryRunner.dropColumn('purchase_orders', 'exchange_rate');
        // Remove currency columns from issued_pos
        await queryRunner.dropColumn('issued_pos', 'currency');
        await queryRunner.dropColumn('issued_pos', 'amount_myr');
        await queryRunner.dropColumn('issued_pos', 'exchange_rate');
        // Remove currency columns from invoices
        await queryRunner.dropColumn('invoices', 'currency');
        await queryRunner.dropColumn('invoices', 'amount_myr');
        await queryRunner.dropColumn('invoices', 'exchange_rate');
    }
}
exports.AddMultiCurrencySupport1734268000000 = AddMultiCurrencySupport1734268000000;
//# sourceMappingURL=1734268000000-AddMultiCurrencySupport.js.map