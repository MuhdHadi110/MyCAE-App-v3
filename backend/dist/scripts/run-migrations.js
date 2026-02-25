"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
async function runMigrations() {
    try {
        console.log('Initializing database connection...');
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        console.log('Running pending migrations...');
        const migrations = await database_1.AppDataSource.runMigrations();
        if (migrations.length === 0) {
            console.log('✅ No pending migrations to run');
        }
        else {
            console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
            migrations.forEach(migration => {
                console.log(`  - ${migration.name}`);
            });
        }
        await database_1.AppDataSource.destroy();
        console.log('Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=run-migrations.js.map