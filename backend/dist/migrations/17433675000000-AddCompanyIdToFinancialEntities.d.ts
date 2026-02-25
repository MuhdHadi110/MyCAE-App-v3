import { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Migration: Add company_id foreign keys to Invoice, IssuedPO, PurchaseOrder, and ReceivedInvoice
 *
 * This migration adds direct company relationships to:
 * - Invoice: Client company (via Project.company_id)
 * - IssuedPO: Vendor company
 * - PurchaseOrder: Client company (via Project.company_id)
 * - ReceivedInvoice: Vendor company
 */
export declare class AddCompanyIdToFinancialEntities17433675000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=17433675000000-AddCompanyIdToFinancialEntities.d.ts.map