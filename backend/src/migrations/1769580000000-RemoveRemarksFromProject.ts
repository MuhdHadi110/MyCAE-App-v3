import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRemarksFromProject1769580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename remarks column to description to preserve data
    await queryRunner.renameColumn('projects', 'remarks', 'description');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename description back to remarks if rolling back
    await queryRunner.renameColumn('projects', 'description', 'remarks');
  }
}
