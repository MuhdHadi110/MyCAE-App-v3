"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebsiteToClients1730307600000 = void 0;
const typeorm_1 = require("typeorm");
class AddWebsiteToClients1730307600000 {
    async up(queryRunner) {
        await queryRunner.addColumn('clients', new typeorm_1.TableColumn({
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
            default: null,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('clients', 'website');
    }
}
exports.AddWebsiteToClients1730307600000 = AddWebsiteToClients1730307600000;
//# sourceMappingURL=1730307600000-AddWebsiteToClients.js.map