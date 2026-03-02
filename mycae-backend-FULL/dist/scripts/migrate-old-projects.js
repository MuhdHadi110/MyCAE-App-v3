"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function migrateProjects() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database');
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        // Get migration file path from command line argument
        const migrationFile = process.argv[2] || 'backend/src/scripts/data/projects-migration.json';
        const fullPath = path.resolve(migrationFile);
        if (!fs.existsSync(fullPath)) {
            console.error(`\n❌ Migration file not found: ${fullPath}`);
            console.log('\nUsage:');
            console.log('  npm run migrate:projects -- path/to/projects-migration.json');
            console.log('  npm run migrate:projects -- path/to/projects-migration.csv');
            process.exit(1);
        }
        let projectsToMigrate = [];
        console.log(`\n📂 Reading file: ${fullPath}`);
        if (fullPath.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            projectsToMigrate = data.projects || data;
        }
        else if (fullPath.endsWith('.csv')) {
            // Simple CSV parser
            const csvData = fs.readFileSync(fullPath, 'utf-8');
            const lines = csvData.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map((h) => h.trim());
            projectsToMigrate = lines.slice(1).map((line) => {
                if (!line.trim())
                    return null;
                const values = line.split(',').map((v) => v.trim());
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            }).filter(Boolean);
        }
        else {
            console.error('❌ File must be .json or .csv');
            process.exit(1);
        }
        console.log(`✓ Found ${projectsToMigrate.length} projects to migrate\n`);
        console.log('📝 Processing migrations...\n');
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        for (const projectData of projectsToMigrate) {
            try {
                // Check if project already exists
                const existing = await projectRepo.findOne({
                    where: { project_code: projectData.project_code }
                });
                if (existing) {
                    console.log(`  ⊘ SKIP  ${projectData.project_code} (already exists)`);
                    skipCount++;
                    continue;
                }
                // Validate required fields
                if (!projectData.project_code || !projectData.title ||
                    !projectData.client_id || !projectData.manager_id) {
                    console.log(`  ✗ ERROR ${projectData.project_code} (missing required fields)`);
                    console.log(`         Required: project_code, title, client_id, manager_id`);
                    errorCount++;
                    continue;
                }
                // Parse dates
                let startDate;
                try {
                    startDate = new Date(projectData.start_date);
                    if (isNaN(startDate.getTime())) {
                        throw new Error('Invalid start_date');
                    }
                }
                catch (error) {
                    console.log(`  ✗ ERROR ${projectData.project_code} (invalid start_date: ${projectData.start_date})`);
                    errorCount++;
                    continue;
                }
                // Create project
                const project = projectRepo.create({
                    project_code: projectData.project_code,
                    title: projectData.title,
                    client_id: projectData.client_id,
                    manager_id: projectData.manager_id,
                    lead_engineer_id: projectData.lead_engineer_id || undefined,
                    status: (projectData.status || 'pre-lim'),
                    start_date: startDate,
                    planned_hours: parseInt(String(projectData.planned_hours || 0)),
                    actual_hours: parseInt(String(projectData.actual_hours || 0)),
                    remarks: projectData.remarks || undefined,
                    completion_date: projectData.completion_date ? new Date(projectData.completion_date) : undefined,
                    po_received_date: projectData.po_received_date ? new Date(projectData.po_received_date) : undefined,
                    invoiced_date: projectData.invoiced_date ? new Date(projectData.invoiced_date) : undefined,
                });
                await projectRepo.save(project);
                console.log(`  ✓ MIGRATED ${projectData.project_code.padEnd(10)} - ${projectData.title}`);
                successCount++;
            }
            catch (error) {
                console.log(`  ✗ ERROR ${projectData.project_code} - ${error.message}`);
                errorCount++;
            }
        }
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Migration completed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  ✓ Migrated:  ${successCount}`);
        console.log(`  ⊘ Skipped:   ${skipCount}`);
        console.log(`  ✗ Errors:    ${errorCount}`);
        console.log(`  ─ Total:     ${projectsToMigrate.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        if (successCount > 0) {
            console.log('🎉 Successfully migrated projects! They are now visible in the application.');
            console.log('   Go to http://localhost:3000/projects to see them.\n');
        }
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('\n❌ Migration error:', error);
        process.exit(1);
    }
}
migrateProjects();
//# sourceMappingURL=migrate-old-projects.js.map