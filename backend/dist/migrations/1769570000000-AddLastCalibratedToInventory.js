"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLastCalibratedToInventory1769570000000 = void 0;
const typeorm_1 = require("typeorm");
class AddLastCalibratedToInventory1769570000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('inventory', new typeorm_1.TableColumn({
            name: 'last_calibrated_date',
            type: 'date',
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('inventory', 'last_calibrated_date');
    }
}
exports.AddLastCalibratedToInventory1769570000000 = AddLastCalibratedToInventory1769570000000;
//# sourceMappingURL=1769570000000-AddLastCalibratedToInventory.js.map