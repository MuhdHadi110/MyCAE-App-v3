import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields1736100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add password reset token columns to users table
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'reset_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reset_token_expires',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Add index for faster token lookup
    await queryRunner.query(`
      CREATE INDEX idx_users_reset_token ON users(reset_token);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX idx_users_reset_token ON users;
    `);

    // Remove columns
    await queryRunner.dropColumns('users', ['reset_token', 'reset_token_expires']);
  }
}
