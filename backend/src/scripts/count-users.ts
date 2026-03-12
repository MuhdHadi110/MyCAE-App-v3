import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function countUsers() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Count users
    const userCount = await AppDataSource.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total Users: ${userCount[0].count}`);

    // List all users
    const users = await AppDataSource.query('SELECT id, name, email, roles, is_active FROM users');
    console.log('\nAll Users:');
    console.log('─'.repeat(80));
    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.roles}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Count team members
    const teamCount = await AppDataSource.query('SELECT COUNT(*) as count FROM team_members');
    console.log(`\nTotal Team Members: ${teamCount[0].count}`);

    if (teamCount[0].count > 0) {
      const teamMembers = await AppDataSource.query(`
        SELECT tm.id, u.name, u.email, tm.department, tm.status, tm.job_title
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
      `);
      console.log('\nTeam Members:');
      console.log('─'.repeat(80));
      teamMembers.forEach((member: any, index: number) => {
        console.log(`${index + 1}. ${member.name} (${member.email})`);
        console.log(`   Department: ${member.department || 'N/A'}`);
        console.log(`   Job Title: ${member.job_title || 'N/A'}`);
        console.log(`   Status: ${member.status}`);
        console.log('');
      });
    }

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

countUsers();
