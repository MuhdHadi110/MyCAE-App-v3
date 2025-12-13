import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Project } from '../entities/Project';

async function clearProjects() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const projectRepo = AppDataSource.getRepository(Project);
    const projects = await projectRepo.find();

    if (projects.length > 0) {
      await projectRepo.remove(projects);
      console.log(`✅ Deleted ${projects.length} projects`);
    } else {
      console.log('ℹ️  No projects found to delete');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All projects cleared!');
    console.log('Now run: npm run seed:data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error clearing projects:', error);
    process.exit(1);
  }
}

clearProjects();
