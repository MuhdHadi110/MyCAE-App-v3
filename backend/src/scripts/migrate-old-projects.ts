import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Project, ProjectStatus } from '../entities/Project';
import * as fs from 'fs';
import * as path from 'path';

interface ProjectData {
  project_code: string;
  title: string;
  client_id: string;
  manager_id: string;
  lead_engineer_id?: string;
  status?: 'pre-lim' | 'ongoing' | 'completed';
  start_date: string | Date;
  planned_hours?: number;
  actual_hours?: number;
  remarks?: string;
  completion_date?: string | Date;
  po_received_date?: string | Date;
  invoiced_date?: string | Date;
}

async function migrateProjects() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const projectRepo = AppDataSource.getRepository(Project);

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

    let projectsToMigrate: ProjectData[] = [];

    console.log(`\n📂 Reading file: ${fullPath}`);

    if (fullPath.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      projectsToMigrate = data.projects || data;
    } else if (fullPath.endsWith('.csv')) {
      // Simple CSV parser
      const csvData = fs.readFileSync(fullPath, 'utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());

      projectsToMigrate = lines.slice(1).map((line) => {
        if (!line.trim()) return null;
        const values = line.split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      }).filter(Boolean) as ProjectData[];
    } else {
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
        let startDate: Date;
        try {
          startDate = new Date(projectData.start_date);
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid start_date');
          }
        } catch (error) {
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
          status: (projectData.status || 'pre-lim') as ProjectStatus,
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
      } catch (error: any) {
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

    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }
}

migrateProjects();
