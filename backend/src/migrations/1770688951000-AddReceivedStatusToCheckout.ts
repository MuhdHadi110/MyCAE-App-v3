import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceivedStatusToCheckout1770688951000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'received' to the checkout status enum
    await queryRunner.query(`
      ALTER TABLE checkouts 
      MODIFY COLUMN status ENUM('checked-out', 'returned', 'overdue', 'partial-return', 'received') 
      NOT NULL DEFAULT 'checked-out'
    `);

    // Update existing "Item received" records from RETURNED to RECEIVED
    await queryRunner.query(`
      UPDATE checkouts 
      SET status = 'received' 
      WHERE purpose LIKE 'Item received:%' 
      AND status = 'returned'
    `);

    console.log('Migration completed: Added RECEIVED status and updated existing records');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert RECEIVED records back to RETURNED
    await queryRunner.query(`
      UPDATE checkouts 
      SET status = 'returned' 
      WHERE status = 'received'
    `);

    // Remove 'received' from enum
    await queryRunner.query(`
      ALTER TABLE checkouts 
      MODIFY COLUMN status ENUM('checked-out', 'returned', 'overdue', 'partial-return') 
      NOT NULL DEFAULT 'checked-out'
    `);
  }
}
