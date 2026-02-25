"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
async function clearProjects() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database');
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const projects = await projectRepo.find();
        if (projects.length > 0) {
            await projectRepo.remove(projects);
            console.log(`✅ Deleted ${projects.length} projects`);
        }
        else {
            console.log('ℹ️  No projects found to delete');
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All projects cleared!');
        console.log('Now run: npm run seed:data');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Error clearing projects:', error);
        process.exit(1);
    }
}
clearProjects();
//# sourceMappingURL=clear-projects.js.map