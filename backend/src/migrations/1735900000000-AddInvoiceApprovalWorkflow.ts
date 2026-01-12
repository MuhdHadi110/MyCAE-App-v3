import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInvoiceApprovalWorkflow1735900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add enum values for new statuses
    await queryRunner.query(`
      ALTER TABLE invoices MODIFY COLUMN status ENUM('draft', 'pending-approval', 'approved', 'sent', 'paid', 'overdue') DEFAULT 'draft'
    `);

    // Change default from 'sent' to 'draft'
    await queryRunner.query(`
      UPDATE invoices SET status = 'draft' WHERE status = 'sent'
    `);

    // Add new columns
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'created_by',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'approved_by',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'approved_at',
        type: 'datetime',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'submitted_for_approval_at',
        type: 'datetime',
        isNullable: true,
      })
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_created_by
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_approved_by
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    // Add index for creator lookups
    await queryRunner.query(`
      CREATE INDEX idx_invoices_created_by ON invoices(created_by)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX idx_invoices_created_by ON invoices`);

    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE invoices DROP FOREIGN KEY fk_invoices_approved_by
    `);

    await queryRunner.query(`
      ALTER TABLE invoices DROP FOREIGN KEY fk_invoices_created_by
    `);

    // Drop columns
    await queryRunner.dropColumn('invoices', 'submitted_for_approval_at');
    await queryRunner.dropColumn('invoices', 'approved_at');
    await queryRunner.dropColumn('invoices', 'approved_by');
    await queryRunner.dropColumn('invoices', 'created_by');

    // Revert status enum
    await queryRunner.query(`
      ALTER TABLE invoices MODIFY COLUMN status ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'sent'
    `);

    await queryRunner.query(`
      UPDATE invoices SET status = 'sent' WHERE status = 'draft'
    `);
  }
}
