import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function deleteUserWithRelations() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const email = 'admin@mycae.com';

    // Find the user
    const user = await AppDataSource.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      console.log(`❌ User not found: ${email}`);
      await AppDataSource.destroy();
      process.exit(1);
    }

    const userId = user[0].id;
    const userName = user[0].name;

    console.log(`Found user: ${userName} (${email})`);
    console.log(`User ID: ${userId}\n`);

    // Check and delete related records
    const tables = [
      { name: 'timesheets', column: 'engineer_id' },
      { name: 'checkouts', column: 'engineer_id' },
      { name: 'maintenance_tickets', column: 'engineer_id' },
      { name: 'research_timesheets', column: 'engineer_id' },
      { name: 'activities', column: 'user_id' },
      { name: 'audit_logs', column: 'user_id' },
      { name: 'team_members', column: 'user_id' },
      { name: 'project_team_members', column: 'team_member_id' },
      { name: 'projects', column: 'lead_engineer_id' },
    ];

    for (const table of tables) {
      try {
        const result = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM ${table.name} WHERE ${table.column} = ?`,
          [userId]
        );
        const count = result[0].count;
        
        if (count > 0) {
          console.log(`Found ${count} record(s) in ${table.name}`);
          await AppDataSource.query(
            `DELETE FROM ${table.name} WHERE ${table.column} = ?`,
            [userId]
          );
          console.log(`✅ Deleted ${count} record(s) from ${table.name}`);
        }
      } catch (err: any) {
        // Table might not exist or column might be different
        console.log(`⚠️ Could not check/delete from ${table.name}: ${err.message}`);
      }
    }

    console.log('\nDeleting user...');
    await AppDataSource.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    console.log(`✅ User ${email} deleted successfully`);

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteUserWithRelations();
