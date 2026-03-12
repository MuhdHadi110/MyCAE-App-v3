import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function searchUsers() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Search for users with 'admin' in email
    const adminUsers = await AppDataSource.query(
      "SELECT id, name, email, roles, is_active FROM users WHERE email LIKE '%admin%'"
    );
    
    console.log(`Users with 'admin' in email: ${adminUsers.length}`);
    console.log('─'.repeat(80));
    adminUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.roles}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log('');
    });

    // List ALL users (no filter)
    const allUsers = await AppDataSource.query('SELECT id, name, email, roles, is_active FROM users ORDER BY email');
    console.log(`\n\nALL USERS IN DATABASE: ${allUsers.length}`);
    console.log('─'.repeat(80));
    allUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.roles}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log('');
    });

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

searchUsers();
