import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function checkTables() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // List of tables that should exist (using actual table names from entities)
    const expectedTables = [
      'users',
      'projects',
      'project_team_members',
      'project_hourly_rates',
      'timesheets',
      'research_projects',
      'research_timesheets',
      'inventory',  // Correct table name
      'checkouts',
      'maintenance_tickets',
      'scheduled_maintenance',
      'activities',
      'clients',
      'companies',
      'contacts',
      'team_members',
      'purchase_orders',
      'invoices',
      'issued_pos',
      'received_invoices',
      'exchange_rates',
      'computers',
      'company_settings',
      'audit_logs'
    ];

    console.log('Checking database tables...\n');
    let missingCount = 0;
    
    for (const tableName of expectedTables) {
      const result = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
      );
      
      const exists = result[0].count > 0;
      if (!exists) missingCount++;
      console.log(`${exists ? '✅' : '❌'} ${tableName}`);
    }

    console.log(`\n${missingCount === 0 ? '✅' : '❌'} ${missingCount} tables missing`);

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
