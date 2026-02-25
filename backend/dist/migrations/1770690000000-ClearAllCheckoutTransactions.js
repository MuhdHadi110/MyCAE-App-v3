"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearAllCheckoutTransactions1770690000000 = void 0;
class ClearAllCheckoutTransactions1770690000000 {
    async up(queryRunner) {
        // Delete all checkout records (equipment transactions)
        await queryRunner.query('DELETE FROM checkouts');
        console.log('✅ All checkout transactions cleared successfully');
    }
    async down(queryRunner) {
        // Cannot restore deleted data without backup
        console.log('⚠️ Cannot restore deleted checkout transactions. Restore from backup if needed.');
    }
}
exports.ClearAllCheckoutTransactions1770690000000 = ClearAllCheckoutTransactions1770690000000;
//# sourceMappingURL=1770690000000-ClearAllCheckoutTransactions.js.map