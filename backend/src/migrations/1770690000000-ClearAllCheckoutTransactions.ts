import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClearAllCheckoutTransactions1770690000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete all checkout records (equipment transactions)
    await queryRunner.query('DELETE FROM checkouts');
    
    console.log('✅ All checkout transactions cleared successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot restore deleted data without backup
    console.log('⚠️ Cannot restore deleted checkout transactions. Restore from backup if needed.');
  }
}
