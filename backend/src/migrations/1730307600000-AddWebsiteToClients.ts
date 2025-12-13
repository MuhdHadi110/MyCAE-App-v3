import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWebsiteToClients1730307600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'website',
        type: 'varchar',
        length: '255',
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('clients', 'website');
  }
}
