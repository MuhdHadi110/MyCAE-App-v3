"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveIsPrimaryFromContacts1736250000000 = void 0;
const typeorm_1 = require("typeorm");
class RemoveIsPrimaryFromContacts1736250000000 {
    async up(queryRunner) {
        await queryRunner.dropColumn('contacts', 'is_primary');
    }
    async down(queryRunner) {
        await queryRunner.addColumn('contacts', new typeorm_1.TableColumn({
            name: 'is_primary',
            type: 'boolean',
            default: false,
        }));
    }
}
exports.RemoveIsPrimaryFromContacts1736250000000 = RemoveIsPrimaryFromContacts1736250000000;
//# sourceMappingURL=1736250000000-RemoveIsPrimaryFromContacts.js.map