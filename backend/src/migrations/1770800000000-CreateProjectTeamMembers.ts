import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { logger } from '../utils/logger';

export class CreateProjectTeamMembers1770800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('project_team_members');
    
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'project_team_members',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'project_id',
              type: 'varchar',
              length: '36',
            },
            {
              name: 'team_member_id',
              type: 'varchar',
              length: '36',
            },
            {
              name: 'role',
              type: 'enum',
              enum: ['lead_engineer', 'engineer'],
              default: "'engineer'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['project_id'],
              referencedTableName: 'projects',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['team_member_id'],
              referencedTableName: 'team_members',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
          uniques: [
            {
              columnNames: ['project_id', 'team_member_id'],
            },
          ],
        })
      );

      logger.info('project_team_members table created');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('project_team_members');
    if (tableExists) {
      await queryRunner.dropTable('project_team_members');
      logger.info('project_team_members table dropped');
    }
  }
}
