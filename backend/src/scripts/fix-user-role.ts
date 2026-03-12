import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function fixUserRole() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Update Muhammad Hadi's role to senior-engineer
    const result = await AppDataSource.query(
      "UPDATE users SET roles = ? WHERE email = 'hadi@mycae.com'",
      ['["senior-engineer"]']
    );

    if (result.affectedRows === 0) {
      console.log('❌ User not found: hadi@mycae.com');
    } else {
      console.log('✅ Role updated successfully for hadi@mycae.com');
      console.log('New role: Senior Engineer');
    }

    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserRole();
