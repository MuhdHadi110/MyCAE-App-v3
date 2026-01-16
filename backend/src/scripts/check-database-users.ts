import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

// Test user emails from deletion script
const TEST_EMAILS = [
  'admin@mycae.com',
  'john@mycae.com',
  'sarah@mycae.com',
  'mike@mycae.com',
  'lisa@mycae.com',
  'test@mycae.com',
  'firsttime@mycae.com',
  'haziq@mycae.com'
];

function formatTable(header: string[], rows: string[][]): void {
  const colWidths = header.map((_, colIndex) => {
    const maxWidth = Math.max(
      header[colIndex].length,
      ...rows.map(row => row[colIndex]?.length || 0)
    );
    return maxWidth + 2;
  });

  const separator = '┌' + colWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
  const rowSeparator = '├' + colWidths.map(w => '─'.repeat(w)).join('┼') + '┤';
  const footer = '└' + colWidths.map(w => '─'.repeat(w)).join('┴') + '┘';

  console.log(separator);
  console.log('│' + header.map((h, i) => h.padEnd(colWidths[i])).join('│') + '│');
  console.log(rowSeparator);

  rows.forEach(row => {
    console.log('│' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('│') + '│');
  });

  console.log(footer);
}

async function checkTestUsers(userRepo: any): Promise<number> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST USERS IN DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const foundTestUsers = [];
  const notFoundEmails = [];

  for (const email of TEST_EMAILS) {
    const user = await userRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'roleValue', 'department', 'position', 'created_at']
    });

    if (user) {
      foundTestUsers.push(user);
    } else {
      notFoundEmails.push(email);
    }
  }

  if (foundTestUsers.length === 0) {
    console.log('✅ No test users found in database!\n');
  } else {
    const header = ['Name', 'Email', 'Role', 'Department', 'Created'];
    const rows = foundTestUsers.map((user: any) => [
      user.name,
      user.email,
      user.roles,  // This will call the getter
      user.department || '-',
      new Date(user.created_at).toISOString().split('T')[0]
    ]);

    formatTable(header, rows);
    console.log(`\n✅ Found ${foundTestUsers.length} test user(s) in database\n`);
  }

  if (notFoundEmails.length > 0) {
    console.log('⚠️  The following test users were not found:');
    notFoundEmails.forEach((email: string) => {
      console.log(`   - ${email}`);
    });
    console.log('');
  }

  return foundTestUsers.length;
}

async function checkFirstTimeUsers(userRepo: any): Promise<number> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 USERS WHO HAVEN\'T LOGGED IN YET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Use raw SQL since is_first_login column not in entity
  const unloggedInUsers = await userRepo.query(
    `SELECT id, name, email, roles, department, position, is_first_login, created_at
     FROM users
     WHERE is_first_login = 1
     ORDER BY created_at ASC`
  );

  if (unloggedInUsers.length === 0) {
    console.log('✅ All users have logged in at least once!\n');
  } else {
    const header = ['Name', 'Email', 'Role', 'Department', 'Created'];
    const rows = unloggedInUsers.map((user: any) => {
      let roles = '-';
      try {
        const parsedRoles = JSON.parse(user.roles);
        roles = Array.isArray(parsedRoles) ? parsedRoles.join(', ') : parsedRoles;
      } catch {
        roles = user.roles || '-';
      }

      return [
        user.name,
        user.email,
        roles,
        user.department || '-',
        new Date(user.created_at).toISOString().split('T')[0]
      ];
    });

    formatTable(header, rows);
    console.log(`\n✅ Found ${unloggedInUsers.length} user(s) who haven't logged in\n`);
  }

  return unloggedInUsers.length;
}

async function showSummary(userRepo: any, testUserCount: number, firstTimeUserCount: number) {
  // Get total user count
  const [countResult] = await userRepo.query('SELECT COUNT(*) as total FROM users');
  const totalUsers = countResult[0]?.total || 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Test Users Found: ${testUserCount}`);
  console.log(`Users Not Logged In: ${firstTimeUserCount}`);
  console.log(`Users Logged In: ${totalUsers - firstTimeUserCount}`);
  if (totalUsers > 0) {
    const percentage = ((firstTimeUserCount / totalUsers) * 100).toFixed(1);
    console.log(`Percentage Not Logged In: ${percentage}%`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepo = AppDataSource.getRepository(User);

    const testUserCount = await checkTestUsers(userRepo);
    const firstTimeUserCount = await checkFirstTimeUsers(userRepo);
    await showSummary(userRepo, testUserCount, firstTimeUserCount);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
