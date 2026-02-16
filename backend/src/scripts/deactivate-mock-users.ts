import { AppDataSource } from '../config/database';

async function deactivateMockUsers() {
  try {
    await AppDataSource.initialize();
    console.log('\n=== Deactivating Mock/Test Users ===\n');
    
    // List of mock users to deactivate
    const mockUsers = [
      'john@mycae.com',
      'lisa@mycae.com', 
      'mike@mycae.com',
      'sarah@mycae.com',
      'mirzamuhd12@gmail.com'
    ];
    
    for (const email of mockUsers) {
      const result = await AppDataSource.query(`
        UPDATE team_members tm
        JOIN users u ON tm.user_id = u.id
        SET tm.status = 'inactive'
        WHERE u.email = ?
      `, [email]);
      
      if (result.affectedRows > 0) {
        console.log(`✅ Deactivated: ${email}`);
      } else {
        console.log(`⚠️ Not found: ${email}`);
      }
    }
    
    console.log('\n=== Mock users deactivated successfully! ===');
    
    // Show remaining active users
    console.log('\n=== Remaining Active Team Members ===\n');
    const activeMembers = await AppDataSource.query(`
      SELECT u.name, u.email, tm.status
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.status = 'active'
      ORDER BY u.name
    `);
    
    activeMembers.forEach((m: any, i: number) => {
      console.log(`${i + 1}. ${m.name} (${m.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

deactivateMockUsers();
