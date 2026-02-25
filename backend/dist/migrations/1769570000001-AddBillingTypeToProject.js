"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBillingTypeToProject1769570000001 = void 0;
const typeorm_1 = require("typeorm");
class AddBillingTypeToProject1769570000001 {
    async up(queryRunner) {
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'billing_type',
            type: 'enum',
            enum: ['hourly', 'lump_sum'],
            default: "'hourly'",
            isNullable: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('projects', 'billing_type');
    }
}
exports.AddBillingTypeToProject1769570000001 = AddBillingTypeToProject1769570000001;
//# sourceMappingURL=1769570000001-AddBillingTypeToProject.js.map