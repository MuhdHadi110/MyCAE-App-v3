#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Use ts-node to handle TypeScript files
require('ts-node').register({
  transpileOnly: true,
  project: './tsconfig.json'
});

// Import required modules using ts-node
const { AppDataSource } = require('./config/database.ts');
const { MigrationRunner } = require('typeorm');

async function runMigration() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    
    // Run pending migrations using TypeORM's built-in method
    const migrations = await AppDataSource.runMigrations();
    
    console.log(`✅ Database migration completed successfully! Executed ${migrations.length} migration(s):`);
    migrations.forEach(migration => {
      console.log(`  - ${migration.name}`);
    });
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

runMigration();