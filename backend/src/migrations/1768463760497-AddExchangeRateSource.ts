import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExchangeRateSource1768463760497 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'purchase_orders',
      new TableColumn({
        name: 'exchange_rate_source',
        type: 'enum',
        enum: ['auto', 'manual'],
        isNullable: true,
        default: null,
      })
    );
    
    await queryRunner.query(`UPDATE purchase_orders SET exchange_rate_source = 'auto' WHERE exchange_rate_source IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('purchase_orders', 'exchange_rate_source');
  }
}