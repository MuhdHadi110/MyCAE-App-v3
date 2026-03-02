"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameClientIdToCompanyId1769496670941 = void 0;
class RenameClientIdToCompanyId1769496670941 {
    async up(queryRunner) {
        // Check if column has already been renamed
        const table = await queryRunner.getTable('projects');
        const companyIdColumn = table?.findColumnByName('company_id');
        const clientIdColumn = table?.findColumnByName('client_id');
        if (companyIdColumn && !clientIdColumn) {
            console.log('✅ Migration already applied: company_id column exists');
            return;
        }
        // Step 1: Drop any existing foreign key constraint on client_id (if exists)
        try {
            await queryRunner.query(`
                ALTER TABLE projects
                DROP FOREIGN KEY FK_projects_client_id
            `);
        }
        catch (error) {
            // Foreign key might not exist, continue
            console.log('No existing FK_projects_client_id to drop');
        }
        // Step 2: Rename the column from client_id to company_id
        await queryRunner.query(`
            ALTER TABLE projects
            CHANGE COLUMN client_id company_id VARCHAR(36) NOT NULL
        `);
        // Step 3: Add foreign key constraint to companies table
        await queryRunner.query(`
            ALTER TABLE projects
            ADD CONSTRAINT FK_projects_company_id
            FOREIGN KEY (company_id) REFERENCES companies(id)
            ON DELETE RESTRICT ON UPDATE CASCADE
        `);
        // Step 4: Add index for performance
        await queryRunner.query(`
            CREATE INDEX IDX_projects_company_id ON projects(company_id)
        `);
    }
    async down(queryRunner) {
        // Rollback: Reverse the migration
        await queryRunner.query(`DROP INDEX IDX_projects_company_id ON projects`);
        await queryRunner.query(`ALTER TABLE projects DROP FOREIGN KEY FK_projects_company_id`);
        await queryRunner.query(`
            ALTER TABLE projects
            CHANGE COLUMN company_id client_id VARCHAR(36) NOT NULL
        `);
        // Optionally restore the old foreign key if it existed
        // (not adding it back since it didn't exist originally based on schema analysis)
    }
}
exports.RenameClientIdToCompanyId1769496670941 = RenameClientIdToCompanyId1769496670941;
//# sourceMappingURL=1769496670941-RenameClientIdToCompanyId.js.map