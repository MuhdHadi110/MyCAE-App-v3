import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const userRepo = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepo.findOne({
      where: { email: 'admin@mycae.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: admin@mycae.com');
      console.log('Credentials: admin@mycae.com / admin123');
      await AppDataSource.destroy();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = userRepo.create({
      name: 'Admin User',
      email: 'admin@mycae.com',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      department: 'Administration',
      position: 'System Administrator'
    });

    await userRepo.save(admin);

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@mycae.com');
    console.log('Password: admin123');
    console.log('Role: Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ You can now login to the application!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
