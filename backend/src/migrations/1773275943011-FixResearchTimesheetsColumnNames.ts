import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class FixResearchTimesheetsColumnNames1773275943011 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const hasTable = await queryRunner.hasTable('research_timesheets');
        if (!hasTable) {
            return;
        }

        // Rename columns from camelCase to snake_case
        await queryRunner.renameColumn('research_timesheets', 'projectId', 'research_project_id');
        await queryRunner.renameColumn('research_timesheets', 'teamMemberId', 'engineer_id');
        await queryRunner.renameColumn('research_timesheets', 'hoursLogged', 'hours');
        await queryRunner.renameColumn('research_timesheets', 'researchCategory', 'research_category');
        await queryRunner.renameColumn('research_timesheets', 'createdDate', 'created_at');
        
        // Add updated_at column if not exists
        const hasUpdatedAt = await queryRunner.hasColumn('research_timesheets', 'updated_at');
        if (!hasUpdatedAt) {
            await queryRunner.addColumn('research_timesheets', new TableColumn({
                name: 'updated_at',
                type: 'datetime',
                isNullable: true,
            }));
        }
        
        // Remove teamMemberName, approvedBy, approvalDate columns if they exist
        const hasTeamMemberName = await queryRunner.hasColumn('research_timesheets', 'teamMemberName');
        if (hasTeamMemberName) {
            await queryRunner.dropColumn('research_timesheets', 'teamMemberName');
        }
        
        const hasApprovedBy = await queryRunner.hasColumn('research_timesheets', 'approvedBy');
        if (hasApprovedBy) {
            await queryRunner.dropColumn('research_timesheets', 'approvedBy');
        }
        
        const hasApprovalDate = await queryRunner.hasColumn('research_timesheets', 'approvalDate');
        if (hasApprovalDate) {
            await queryRunner.dropColumn('research_timesheets', 'approvalDate');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse the changes
        await queryRunner.renameColumn('research_timesheets', 'research_project_id', 'projectId');
        await queryRunner.renameColumn('research_timesheets', 'engineer_id', 'teamMemberId');
        await queryRunner.renameColumn('research_timesheets', 'hours', 'hoursLogged');
        await queryRunner.renameColumn('research_timesheets', 'research_category', 'researchCategory');
        await queryRunner.renameColumn('research_timesheets', 'created_at', 'createdDate');
        
        // Re-add removed columns
        const hasTeamMemberName = await queryRunner.hasColumn('research_timesheets', 'teamMemberName');
        if (!hasTeamMemberName) {
            await queryRunner.addColumn('research_timesheets', new TableColumn({
                name: 'teamMemberName',
                type: 'varchar',
                length: '255',
            }));
        }
        
        const hasApprovedBy = await queryRunner.hasColumn('research_timesheets', 'approvedBy');
        if (!hasApprovedBy) {
            await queryRunner.addColumn('research_timesheets', new TableColumn({
                name: 'approvedBy',
                type: 'varchar',
                length: '36',
                isNullable: true,
            }));
        }
        
        const hasApprovalDate = await queryRunner.hasColumn('research_timesheets', 'approvalDate');
        if (!hasApprovalDate) {
            await queryRunner.addColumn('research_timesheets', new TableColumn({
                name: 'approvalDate',
                type: 'datetime',
                isNullable: true,
            }));
        }
    }

}
