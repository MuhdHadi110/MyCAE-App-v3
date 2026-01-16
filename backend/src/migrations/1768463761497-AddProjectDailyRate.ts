import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProjectDailyRate1768463761497 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'daily_rate',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'daily_rate');
  }
}