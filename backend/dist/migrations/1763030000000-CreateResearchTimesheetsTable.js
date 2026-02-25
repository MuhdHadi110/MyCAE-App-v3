"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateResearchTimesheetsTable1763030000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateResearchTimesheetsTable1763030000000 {
    async up(queryRunner) {
        // Create research_projects table if it doesn't exist
        const hasResearchProjects = await queryRunner.hasTable('research_projects');
        if (!hasResearchProjects) {
            await queryRunner.createTable(new typeorm_1.Table({
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
            }), true);
        }
        // Create research_timesheets table if it doesn't exist
        const hasResearchTimesheets = await queryRunner.hasTable('research_timesheets');
        if (!hasResearchTimesheets) {
            await queryRunner.createTable(new typeorm_1.Table({
                name: 'research_timesheets',
                columns: [
                    { name: 'id', type: 'varchar', length: '36', isPrimary: true },
                    { name: 'projectId', type: 'varchar', length: '36' },
                    { name: 'teamMemberId', type: 'varchar', length: '36' },
                    { name: 'teamMemberName', type: 'varchar', length: '255' },
                    { name: 'date', type: 'date' },
                    { name: 'hoursLogged', type: 'decimal', precision: 5, scale: 2 },
                    { name: 'description', type: 'text' },
                    { name: 'researchCategory', type: 'varchar', length: '100', isNullable: true },
                    { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
                    { name: 'createdDate', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                    { name: 'approvedBy', type: 'varchar', length: '36', isNullable: true },
                    { name: 'approvalDate', type: 'datetime', isNullable: true },
                ],
            }), true);
        }
    }
    async down(queryRunner) {
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
exports.CreateResearchTimesheetsTable1763030000000 = CreateResearchTimesheetsTable1763030000000;
//# sourceMappingURL=1763030000000-CreateResearchTimesheetsTable.js.map