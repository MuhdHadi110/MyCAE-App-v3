import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function checkUserRole() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Check Muhammad Hadi's user record
    const user = await AppDataSource.query(
      "SELECT id, name, email, roles, is_active FROM users WHERE email = 'hadi@mycae.com'"
    );

    if (user.length === 0) {
      console.log('❌ User not found: hadi@mycae.com');
    } else {
      console.log('User Record:');
      console.log('─'.repeat(60));
      console.log(`ID: ${user[0].id}`);
      console.log(`Name: ${user[0].name}`);
      console.log(`Email: ${user[0].email}`);
      console.log(`Roles: ${user[0].roles}`);
      console.log(`Active: ${user[0].is_active}`);
      console.log('');
      
      // Check team member record
      const teamMember = await AppDataSource.query(
        "SELECT * FROM team_members WHERE user_id = ?",
        [user[0].id]
      );
      
      if (teamMember.length > 0) {
        console.log('Team Member Record:');
        console.log('─'.repeat(60));
        console.log(`ID: ${teamMember[0].id}`);
        console.log(`Department: ${teamMember[0].department}`);
        console.log(`Job Title: ${teamMember[0].job_title}`);
        console.log(`Status: ${teamMember[0].status}`);
        console.log(`Employment Type: ${teamMember[0].employment_type}`);
      } else {
        console.log('❌ No team member record found');
      }
    }

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserRole();
