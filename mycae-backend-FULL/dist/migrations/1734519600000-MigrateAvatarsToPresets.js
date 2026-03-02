"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateAvatarsToPresets1734519600000 = void 0;
class MigrateAvatarsToPresets1734519600000 {
    async up(queryRunner) {
        // Get all users with avatars
        const users = await queryRunner.query('SELECT id, avatar FROM users WHERE avatar IS NOT NULL');
        for (const user of users) {
            // Check if already a valid preset avatar
            const presetPattern = /^(male|female)-(0[1-9]|10)$/;
            if (presetPattern.test(user.avatar)) {
                continue;
            }
            // Assign random avatar
            const genders = ['male', 'female'];
            const randomGender = genders[Math.floor(Math.random() * 2)];
            const randomNum = String(Math.floor(Math.random() * 10) + 1).padStart(2, '0');
            const newAvatar = `${randomGender}-${randomNum}`;
            await queryRunner.query('UPDATE users SET avatar = ? WHERE id = ?', [newAvatar, user.id]);
        }
        // Assign default avatars to users without one
        const usersWithoutAvatar = await queryRunner.query('SELECT id FROM users WHERE avatar IS NULL');
        for (const user of usersWithoutAvatar) {
            const genders = ['male', 'female'];
            const randomGender = genders[Math.floor(Math.random() * 2)];
            const randomNum = String(Math.floor(Math.random() * 10) + 1).padStart(2, '0');
            const newAvatar = `${randomGender}-${randomNum}`;
            await queryRunner.query('UPDATE users SET avatar = ? WHERE id = ?', [newAvatar, user.id]);
        }
        console.log('✅ Avatar migration completed successfully');
    }
    async down(queryRunner) {
        // Rollback: Set all avatars to NULL
        await queryRunner.query('UPDATE users SET avatar = NULL');
        console.log('✅ Avatar migration rolled back successfully');
    }
}
exports.MigrateAvatarsToPresets1734519600000 = MigrateAvatarsToPresets1734519600000;
//# sourceMappingURL=1734519600000-MigrateAvatarsToPresets.js.map