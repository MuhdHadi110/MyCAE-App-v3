"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeLeadEngineerOptional1730635200000 = void 0;
class MakeLeadEngineerOptional1730635200000 {
    constructor() {
        this.name = 'MakeLeadEngineerOptional1730635200000';
    }
    async up(queryRunner) {
        // Drop the foreign key constraint
        await queryRunner.query(`ALTER TABLE projects DROP FOREIGN KEY FK_d6808738576f5be91ff768ef425`).catch(() => {
            // Constraint might not exist
        });
        // Make lead_engineer_id nullable
        await queryRunner.query(`ALTER TABLE projects MODIFY COLUMN lead_engineer_id VARCHAR(36) NULL`);
        // Re-add the foreign key constraint as optional
        await queryRunner.query(`ALTER TABLE projects ADD CONSTRAINT FK_d6808738576f5be91ff768ef425 FOREIGN KEY (lead_engineer_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION`).catch(() => {
            // Constraint might already exist
        });
    }
    async down(queryRunner) {
        // Revert: Make lead_engineer_id non-nullable
        await queryRunner.query(`ALTER TABLE projects MODIFY COLUMN lead_engineer_id VARCHAR(36) NOT NULL`);
    }
}
exports.MakeLeadEngineerOptional1730635200000 = MakeLeadEngineerOptional1730635200000;
//# sourceMappingURL=1730635200000-MakeLeadEngineerOptional.js.map