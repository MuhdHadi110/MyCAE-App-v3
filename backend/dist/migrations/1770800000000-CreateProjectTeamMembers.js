"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProjectTeamMembers1770800000000 = void 0;
const typeorm_1 = require("typeorm");
const logger_1 = require("../utils/logger");
class CreateProjectTeamMembers1770800000000 {
    async up(queryRunner) {
        const tableExists = await queryRunner.hasTable('project_team_members');
        if (!tableExists) {
            await queryRunner.createTable(new typeorm_1.Table({
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
            }));
            logger_1.logger.info('project_team_members table created');
        }
    }
    async down(queryRunner) {
        const tableExists = await queryRunner.hasTable('project_team_members');
        if (tableExists) {
            await queryRunner.dropTable('project_team_members');
            logger_1.logger.info('project_team_members table dropped');
        }
    }
}
exports.CreateProjectTeamMembers1770800000000 = CreateProjectTeamMembers1770800000000;
//# sourceMappingURL=1770800000000-CreateProjectTeamMembers.js.map