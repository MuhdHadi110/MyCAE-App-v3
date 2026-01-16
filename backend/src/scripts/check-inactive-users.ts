import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

async function checkInactiveUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepo = AppDataSource.getRepository(User);

    // Get all users with is_first_login status
    const allUsers = await userRepo.query(
      `SELECT id, name, email, department, position, is_first_login, created_at, updated_at
       FROM users
       ORDER BY is_first_login ASC, created_at ASC`
    );

    const neverLoggedIn = allUsers.filter((u: any) => u.is_first_login === 1);
    const haveLoggedIn = allUsers.filter((u: any) => u.is_first_login === 0);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 USER ACTIVITY ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total Users: ${allUsers.length}`);
    console.log(`Never Logged In: ${neverLoggedIn.length}`);
    console.log(`Have Logged In: ${haveLoggedIn.length}\n`);

    if (neverLoggedIn.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 USERS WHO HAVE NEVER LOGGED IN (INACTIVE)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const now = new Date();
      neverLoggedIn.forEach((user: any) => {
        const created = new Date(user.created_at);
        const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        const status = daysSinceCreation > 60 ? '⚠️  Long-term inactive (>60 days)' :
                      daysSinceCreation > 30 ? '⚠️  Moderately inactive (>30 days)' :
                      '📌  Recently created (<30 days)';

        console.log(`${status}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Department: ${user.department || 'Not set'}`);
        console.log(`   Position: ${user.position || 'Not set'}`);
        console.log(`   Created: ${created.toISOString().split('T')[0]} (${daysSinceCreation} days ago)`);
        console.log(`   Last Updated: ${new Date(user.updated_at).toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    if (haveLoggedIn.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ACTIVE USERS (HAVE LOGGED IN)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      haveLoggedIn.forEach((user: any) => {
        console.log(`✅ ${user.name} (${user.email})`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users: ${allUsers.length}`);
    console.log(`Inactive (Never Logged In): ${neverLoggedIn.length} (${((neverLoggedIn.length / allUsers.length) * 100).toFixed(1)}%)`);
    console.log(`Active (Have Logged In): ${haveLoggedIn.length} (${((haveLoggedIn.length / allUsers.length) * 100).toFixed(1)}%)`);

    if (neverLoggedIn.length > 0) {
      const avgDaysInactive = neverLoggedIn.reduce((sum: number, user: any) => {
        const created = new Date(user.created_at);
        const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysSinceCreation;
      }, 0) / neverLoggedIn.length;

      console.log(`Average Time Since Creation: ${avgDaysInactive.toFixed(0)} days`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 RECOMMENDATIONS:');
    if (neverLoggedIn.length > 0) {
      console.log('   • Consider sending password setup emails to inactive users');
      console.log('   • Contact users who have been inactive for 30+ days');
      console.log('   • Delete accounts created 60+ days ago that are inactive (optional)');
    }
    console.log('');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const now = new Date();
checkInactiveUsers();
