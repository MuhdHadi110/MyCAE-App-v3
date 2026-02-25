"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProjectDailyRate1768463761497 = void 0;
const typeorm_1 = require("typeorm");
class AddProjectDailyRate1768463761497 {
    async up(queryRunner) {
        await queryRunner.addColumn('projects', new typeorm_1.TableColumn({
            name: 'daily_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            default: null,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('projects', 'daily_rate');
    }
}
exports.AddProjectDailyRate1768463761497 = AddProjectDailyRate1768463761497;
//# sourceMappingURL=1768463761497-AddProjectDailyRate.js.map