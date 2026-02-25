"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function clearCheckoutTransactions() {
    try {
        console.log('Connecting to database...');
        await database_1.AppDataSource.initialize();
        console.log('Clearing all checkout transactions...');
        await database_1.AppDataSource.query('DELETE FROM checkouts');
        console.log('✅ All checkout transactions cleared successfully!');
        console.log('All equipment has been returned to inventory.');
    }
    catch (error) {
        console.error('❌ Error clearing transactions:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
}
clearCheckoutTransactions();
//# sourceMappingURL=clear-checkout-transactions.js.map