import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeLeadEngineerOptional1730635200000 implements MigrationInterface {
  name = 'MakeLeadEngineerOptional1730635200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(
      `ALTER TABLE projects DROP FOREIGN KEY FK_d6808738576f5be91ff768ef425`
    ).catch(() => {
      // Constraint might not exist
    });

    // Make lead_engineer_id nullable
    await queryRunner.query(
      `ALTER TABLE projects MODIFY COLUMN lead_engineer_id VARCHAR(36) NULL`
    );

    // Re-add the foreign key constraint as optional
    await queryRunner.query(
      `ALTER TABLE projects ADD CONSTRAINT FK_d6808738576f5be91ff768ef425 FOREIGN KEY (lead_engineer_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION`
    ).catch(() => {
      // Constraint might already exist
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Make lead_engineer_id non-nullable
    await queryRunner.query(
      `ALTER TABLE projects MODIFY COLUMN lead_engineer_id VARCHAR(36) NOT NULL`
    );
  }
}
