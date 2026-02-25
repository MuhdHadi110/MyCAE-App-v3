"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveRemarksFromProject1769580000000 = void 0;
class RemoveRemarksFromProject1769580000000 {
    async up(queryRunner) {
        // Rename remarks column to description to preserve data
        await queryRunner.renameColumn('projects', 'remarks', 'description');
    }
    async down(queryRunner) {
        // Rename description back to remarks if rolling back
        await queryRunner.renameColumn('projects', 'description', 'remarks');
    }
}
exports.RemoveRemarksFromProject1769580000000 = RemoveRemarksFromProject1769580000000;
//# sourceMappingURL=1769580000000-RemoveRemarksFromProject.js.map