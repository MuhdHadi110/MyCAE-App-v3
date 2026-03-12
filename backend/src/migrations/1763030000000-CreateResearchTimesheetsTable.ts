import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateResearchTimesheetsTable1763030000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create research_projects table if it doesn't exist
    const hasResearchProjects = await queryRunner.hasTable('research_projects');
    if (!hasResearchProjects) {
      await queryRunner.createTable(
        new Table({
          name: 'research_projects',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true },
            { name: 'title', type: 'varchar', length: '255' },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'status', type: 'varchar', length: '20', default: "'active'" },
            { name: 'startDate', type: 'datetime' },
            { name: 'endDate', type: 'datetime', isNullable: true },
            { name: 'leadResearcherId', type: 'varchar', length: '36' },
            { name: 'teamMembers', type: 'text', isNullable: true },
            { name: 'budget', type: 'decimal', precision: 10, scale: 2, isNullable: true },
            { name: 'actualSpend', type: 'decimal', precision: 10, scale: 2, isNullable: true },
            { name: 'findings', type: 'text', isNullable: true },
            { name: 'researchCode', type: 'varchar', length: '50', isNullable: true },
            { name: 'plannedHours', type: 'decimal', precision: 10, scale: 2, default: 0 },
            { name: 'totalHoursLogged', type: 'decimal', precision: 10, scale: 2, default: 0 },
            { name: 'createdDate', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
            { name: 'lastUpdated', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );
    }

    // Create research_timesheets table if it doesn't exist
    const hasResearchTimesheets = await queryRunner.hasTable('research_timesheets');
    if (!hasResearchTimesheets) {
      await queryRunner.createTable(
        new Table({
          name: 'research_timesheets',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true },
            { name: 'research_project_id', type: 'varchar', length: '36' },
            { name: 'engineer_id', type: 'varchar', length: '36' },
            { name: 'date', type: 'date' },
            { name: 'hours', type: 'decimal', precision: 5, scale: 2 },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'research_category', type: 'varchar', length: '100', isNullable: true },
            { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
            { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasResearchTimesheets = await queryRunner.hasTable('research_timesheets');
    if (hasResearchTimesheets) {
      await queryRunner.dropTable('research_timesheets');
    }

    const hasResearchProjects = await queryRunner.hasTable('research_projects');
    if (hasResearchProjects) {
      await queryRunner.dropTable('research_projects');
    }
  }
}
