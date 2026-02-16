import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastCalibratedToInventory1769570000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inventory',
      new TableColumn({
        name: 'last_calibrated_date',
        type: 'date',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inventory', 'last_calibrated_date');
  }
}
