import 'reflect-metadata';
import { AppDataSource } from '../config/database';

const USER_TO_DELETE = 'naaimhafiz1@mycae.com.my';

async function deleteUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const queryRunner = AppDataSource.createQueryRunner();

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗑️  DELETING USER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Find user first
      const users = await queryRunner.query(
        `SELECT id, name, email, roles FROM users WHERE email = ?`,
        [USER_TO_DELETE]
      );

      if (!users || users.length === 0) {
        console.log('⚠️  User not found in database:');
        console.log(`   Email: ${USER_TO_DELETE}`);
        console.log('\nNo deletion needed.\n');
        return;
      }

      const user = users[0];
      console.log('Found user to delete:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.roles}`);
      console.log(`   ID: ${user.id}\n`);

      // Delete from team_members first (foreign key constraint)
      const tmResult = await queryRunner.query(
        'DELETE FROM team_members WHERE user_id = ?',
        [user.id]
      );
      console.log(`✅ Deleted ${tmResult.affectedRows} record(s) from team_members`);

      // Delete from timesheets (if any)
      const timesheetResult = await queryRunner.query(
        'DELETE FROM timesheets WHERE engineer_id = ?',
        [user.id]
      );
      if (timesheetResult.affectedRows > 0) {
        console.log(`✅ Deleted ${timesheetResult.affectedRows} timesheet record(s)`);
      }

      // Delete user
      const deleteResult = await queryRunner.query(
        'DELETE FROM users WHERE email = ?',
        [USER_TO_DELETE]
      );

      if (deleteResult.affectedRows > 0) {
        console.log(`✅ User deleted successfully!\n`);

        // Show remaining users
        const remainingUsers = await queryRunner.query(
          'SELECT name, email FROM users ORDER BY name ASC'
        );

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 REMAINING USERS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        if (remainingUsers.length === 0) {
          console.log('❌ No users remaining');
        } else {
          remainingUsers.forEach((u: any) => {
            console.log(`👤 ${u.name} (${u.email})`);
          });
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`✅ Total remaining users: ${remainingUsers.length}`);
      } else {
        console.log('❌ Failed to delete user\n');
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ DELETION COMPLETE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } finally {
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteUser();
