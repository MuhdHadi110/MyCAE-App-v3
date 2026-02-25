"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seedAdmin() {
    try {
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        console.log('✅ Connected to database');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Check if admin already exists
        const existingAdmin = await userRepo.findOne({
            where: { email: 'admin@mycae.com' }
        });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email: admin@mycae.com');
            console.log('Credentials: admin@mycae.com / admin123');
            await database_1.AppDataSource.destroy();
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
        // Create admin user
        const admin = userRepo.create({
            name: 'Admin User',
            email: 'admin@mycae.com',
            password_hash: hashedPassword,
            role: User_1.UserRole.ADMIN,
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
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Error seeding admin user:', error);
        process.exit(1);
    }
}
seedAdmin();
//# sourceMappingURL=seed-admin.js.map