"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCompanyIdToFinancialEntities17433675000000 = void 0;
/**
 * Migration: Add company_id foreign keys to Invoice, IssuedPO, PurchaseOrder, and ReceivedInvoice
 *
 * This migration adds direct company relationships to:
 * - Invoice: Client company (via Project.company_id)
 * - IssuedPO: Vendor company
 * - PurchaseOrder: Client company (via Project.company_id)
 * - ReceivedInvoice: Vendor company
 */
class AddCompanyIdToFinancialEntities17433675000000 {
    async up(queryRunner) {
        console.log('Starting migration: AddCompanyIdToFinancialEntities\n');
        // ===== 1. Add company_id to invoices table =====
        const invoicesTableExists = await queryRunner.hasTable('invoices');
        if (invoicesTableExists) {
            const invoicesColumns = await queryRunner.getTable('invoices');
            if (!invoicesColumns) {
                console.log('  Cannot access invoices table structure, skipping...');
            }
            else {
                const companyIdColumn = invoicesColumns.findColumnByName('company_id');
                if (!companyIdColumn) {
                    console.log('  Adding company_id to invoices table...');
                    await queryRunner.query(`
                        ALTER TABLE invoices
                        ADD COLUMN company_id VARCHAR(36) NULL
                    `);
                    await queryRunner.query(`
                        ALTER TABLE invoices
                        ADD CONSTRAINT FK_invoices_company_id
                        FOREIGN KEY (company_id) REFERENCES companies(id)
                        ON DELETE RESTRICT ON UPDATE CASCADE
                    `);
                    await queryRunner.query(`
                        CREATE INDEX IDX_invoices_company_id ON invoices(company_id)
                    `);
                    console.log('  company_id added to invoices table');
                    console.log('  Migrating existing invoice data to company_id...');
                    await queryRunner.query(`
                        UPDATE invoices i
                        LEFT JOIN projects p ON i.project_code = p.project_code
                        SET i.company_id = p.company_id
                        WHERE i.company_id IS NULL AND p.company_id IS NOT NULL
                    `);
                    console.log('  Invoice data migrated');
                }
                else {
                    console.log('  company_id already exists in invoices table');
                }
            }
        }
        // ===== 2. Add company_id to issued_pos table =====
        const issuedPosTableExists = await queryRunner.hasTable('issued_pos');
        if (issuedPosTableExists) {
            const issuedPosColumns = await queryRunner.getTable('issued_pos');
            if (!issuedPosColumns) {
                console.log('  Cannot access issued_pos table structure, skipping...');
            }
            else {
                const companyIdColumn = issuedPosColumns.findColumnByName('company_id');
                if (!companyIdColumn) {
                    console.log('  Adding company_id to issued_pos table...');
                    await queryRunner.query(`
                        ALTER TABLE issued_pos
                        ADD COLUMN company_id VARCHAR(36) NULL
                    `);
                    await queryRunner.query(`
                        ALTER TABLE issued_pos
                        ADD CONSTRAINT FK_issued_pos_company_id
                        FOREIGN KEY (company_id) REFERENCES companies(id)
                        ON DELETE RESTRICT ON UPDATE CASCADE
                    `);
                    await queryRunner.query(`
                        CREATE INDEX IDX_issued_pos_company_id ON issued_pos(company_id)
                    `);
                    console.log('  company_id added to issued_pos table');
                    console.log('  Migrating existing issued PO data to company_id...');
                    const result = await queryRunner.query(`
                        UPDATE issued_pos ipo
                        LEFT JOIN companies c ON ipo.recipient = c.name
                        SET ipo.company_id = c.id
                        WHERE ipo.company_id IS NULL AND c.id IS NOT NULL
                    `);
                    console.log(`  IssuedPO data migrated: ${result.affectedRows || 'unknown'} rows updated`);
                }
                else {
                    console.log('  company_id already exists in issued_pos table');
                }
            }
        }
        // ===== 3. Add company_id to purchase_orders table =====
        const purchaseOrdersTableExists = await queryRunner.hasTable('purchase_orders');
        if (purchaseOrdersTableExists) {
            const purchaseOrdersColumns = await queryRunner.getTable('purchase_orders');
            if (!purchaseOrdersColumns) {
                console.log('  Cannot access purchase_orders table structure, skipping...');
            }
            else {
                const companyIdColumn = purchaseOrdersColumns.findColumnByName('company_id');
                if (!companyIdColumn) {
                    console.log('  Adding company_id to purchase_orders table...');
                    await queryRunner.query(`
                        ALTER TABLE purchase_orders
                        ADD COLUMN company_id VARCHAR(36) NULL
                    `);
                    await queryRunner.query(`
                        ALTER TABLE purchase_orders
                        ADD CONSTRAINT FK_purchase_orders_company_id
                        FOREIGN KEY (company_id) REFERENCES companies(id)
                        ON DELETE RESTRICT ON UPDATE CASCADE
                    `);
                    await queryRunner.query(`
                        CREATE INDEX IDX_purchase_orders_company_id ON purchase_orders(company_id)
                    `);
                    console.log('  company_id added to purchase_orders table');
                    console.log('  Migrating existing PO data to company_id...');
                    await queryRunner.query(`
                        UPDATE purchase_orders po
                        LEFT JOIN projects p ON po.project_code = p.project_code
                        SET po.company_id = p.company_id
                        WHERE po.company_id IS NULL AND p.company_id IS NOT NULL
                    `);
                    console.log('  PurchaseOrder data migrated');
                }
                else {
                    console.log('  company_id already exists in purchase_orders table');
                }
            }
        }
        // ===== 4. Add company_id to received_invoices table =====
        const receivedInvoicesTableExists = await queryRunner.hasTable('received_invoices');
        if (receivedInvoicesTableExists) {
            const receivedInvoicesColumns = await queryRunner.getTable('received_invoices');
            if (!receivedInvoicesColumns) {
                console.log('  Cannot access received_invoices table structure, skipping...');
            }
            else {
                const companyIdColumn = receivedInvoicesColumns.findColumnByName('company_id');
                if (!companyIdColumn) {
                    console.log('  Adding company_id to received_invoices table...');
                    await queryRunner.query(`
                        ALTER TABLE received_invoices
                        ADD COLUMN company_id VARCHAR(36) NULL
                    `);
                    await queryRunner.query(`
                        ALTER TABLE received_invoices
                        ADD CONSTRAINT FK_received_invoices_company_id
                        FOREIGN KEY (company_id) REFERENCES companies(id)
                        ON DELETE RESTRICT ON UPDATE CASCADE
                    `);
                    await queryRunner.query(`
                        CREATE INDEX IDX_received_invoices_company_id ON received_invoices(company_id)
                    `);
                    console.log('  company_id added to received_invoices table');
                    console.log('  Migrating existing received invoice data to company_id...');
                    const result = await queryRunner.query(`
                        UPDATE received_invoices ri
                        LEFT JOIN companies c ON ri.vendor_name = c.name
                        SET ri.company_id = c.id
                        WHERE ri.company_id IS NULL AND c.id IS NOT NULL
                    `);
                    console.log(`  ReceivedInvoice data migrated: ${result.affectedRows || 'unknown'} rows updated`);
                }
                else {
                    console.log('  company_id already exists in received_invoices table');
                }
            }
        }
        console.log('\nMigration completed successfully!\n');
        console.log('Summary:');
        console.log('  - invoices.company_id added');
        console.log('  - issued_pos.company_id added');
        console.log('  - purchase_orders.company_id added');
        console.log('  - received_invoices.company_id added');
        console.log('  - Foreign key constraints added');
        console.log('  - Performance indexes added');
        console.log('  - Existing data migrated\n');
    }
    async down(queryRunner) {
        console.log('Rolling back migration: AddCompanyIdToFinancialEntities\n');
        await queryRunner.query(`DROP INDEX IDX_invoices_company_id ON invoices`).catch(() => { });
        await queryRunner.query(`DROP INDEX IDX_issued_pos_company_id ON issued_pos`).catch(() => { });
        await queryRunner.query(`DROP INDEX IDX_purchase_orders_company_id ON purchase_orders`).catch(() => { });
        await queryRunner.query(`DROP INDEX IDX_received_invoices_company_id ON received_invoices`).catch(() => { });
        await queryRunner.query(`ALTER TABLE invoices DROP FOREIGN KEY FK_invoices_company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE issued_pos DROP FOREIGN KEY FK_issued_pos_company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE purchase_orders DROP FOREIGN KEY FK_purchase_orders_company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE received_invoices DROP FOREIGN KEY FK_received_invoices_company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE invoices DROP COLUMN company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE issued_pos DROP COLUMN company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE purchase_orders DROP COLUMN company_id`).catch(() => { });
        await queryRunner.query(`ALTER TABLE received_invoices DROP COLUMN company_id`).catch(() => { });
        console.log('Rollback completed\n');
    }
}
exports.AddCompanyIdToFinancialEntities17433675000000 = AddCompanyIdToFinancialEntities17433675000000;
//# sourceMappingURL=17433675000000-AddCompanyIdToFinancialEntities.js.map