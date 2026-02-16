import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBillingTypeToProject1769570000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'billing_type',
        type: 'enum',
        enum: ['hourly', 'lump_sum'],
        default: "'hourly'",
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'billing_type');
  }
}
