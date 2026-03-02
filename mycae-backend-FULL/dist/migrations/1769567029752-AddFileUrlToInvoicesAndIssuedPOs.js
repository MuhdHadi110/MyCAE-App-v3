"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFileUrlToInvoicesAndIssuedPOs1769567029752 = void 0;
class AddFileUrlToInvoicesAndIssuedPOs1769567029752 {
    async up(queryRunner) {
        // Check if columns already exist
        const invoicesTable = await queryRunner.getTable('invoices');
        const invoicesFileUrlColumn = invoicesTable?.findColumnByName('file_url');
        const issuedPOsTable = await queryRunner.getTable('issued_pos');
        const issuedPOsFileUrlColumn = issuedPOsTable?.findColumnByName('file_url');
        // Add file_url column to invoices table if it doesn't exist
        if (!invoicesFileUrlColumn) {
            await queryRunner.query(`
                ALTER TABLE invoices
                ADD COLUMN file_url VARCHAR(255) NULL
            `);
            console.log('✅ Added file_url column to invoices table');
        }
        else {
            console.log('✅ file_url column already exists in invoices table');
        }
        // Add file_url column to issued_pos table if it doesn't exist
        if (!issuedPOsFileUrlColumn) {
            await queryRunner.query(`
                ALTER TABLE issued_pos
                ADD COLUMN file_url VARCHAR(255) NULL
            `);
            console.log('✅ Added file_url column to issued_pos table');
        }
        else {
            console.log('✅ file_url column already exists in issued_pos table');
        }
    }
    async down(queryRunner) {
        // Remove file_url column from invoices table
        await queryRunner.query(`
            ALTER TABLE invoices
            DROP COLUMN file_url
        `);
        // Remove file_url column from issued_pos table
        await queryRunner.query(`
            ALTER TABLE issued_pos
            DROP COLUMN file_url
        `);
        console.log('✅ Removed file_url columns from invoices and issued_pos tables');
    }
}
exports.AddFileUrlToInvoicesAndIssuedPOs1769567029752 = AddFileUrlToInvoicesAndIssuedPOs1769567029752;
//# sourceMappingURL=1769567029752-AddFileUrlToInvoicesAndIssuedPOs.js.map