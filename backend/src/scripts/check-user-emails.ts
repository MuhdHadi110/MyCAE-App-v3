import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

async function checkUserEmails() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepo = AppDataSource.getRepository(User);

    // Get all users
    const users = await userRepo.query(
      'SELECT id, name, email FROM users ORDER BY name ASC'
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ALL USERS IN DATABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    users.forEach((user: any) => {
      const email = user.email || 'N/A';
      const match = email.includes('naaimhafiz') ? '🎯 MATCH!' : '';
      console.log(`${match} ${user.name} (${email})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total users: ${users.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserEmails();
