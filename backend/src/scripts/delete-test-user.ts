import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { TeamMember } from '../entities/TeamMember';

async function deleteTestUser() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(TeamMember);

    // Find user
    const user = await userRepo.findOne({ where: { email: 'mirzamuhd12@gmail.com' } });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.id, user.name);

    // Find and delete team member first (due to foreign key)
    const teamMember = await teamRepo.findOne({ where: { user_id: user.id } });
    if (teamMember) {
      await teamRepo.remove(teamMember);
      console.log('✅ Team member deleted');
    }

    // Delete user
    await userRepo.remove(user);
    console.log('✅ User deleted');

    console.log('\n✅ Test user mirzamuhd12@gmail.com has been removed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

deleteTestUser();
