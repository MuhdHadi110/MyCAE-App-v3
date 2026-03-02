"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExchangeRateSource1768463760497 = void 0;
const typeorm_1 = require("typeorm");
class AddExchangeRateSource1768463760497 {
    async up(queryRunner) {
        await queryRunner.addColumn('purchase_orders', new typeorm_1.TableColumn({
            name: 'exchange_rate_source',
            type: 'enum',
            enum: ['auto', 'manual'],
            isNullable: true,
            default: null,
        }));
        await queryRunner.query(`UPDATE purchase_orders SET exchange_rate_source = 'auto' WHERE exchange_rate_source IS NULL`);
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('purchase_orders', 'exchange_rate_source');
    }
}
exports.AddExchangeRateSource1768463760497 = AddExchangeRateSource1768463760497;
//# sourceMappingURL=1768463760497-AddExchangeRateSource.js.map