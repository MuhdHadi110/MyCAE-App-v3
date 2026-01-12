import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveIsPrimaryFromContacts1736250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('contacts', 'is_primary');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'contacts',
      new TableColumn({
        name: 'is_primary',
        type: 'boolean',
        default: false,
      })
    );
  }
}
