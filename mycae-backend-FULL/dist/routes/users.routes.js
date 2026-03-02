"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/users
 * Get all users (for dropdowns like lead researcher selection)
 */
router.get('/', async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const users = await userRepo.find({
            select: ['id', 'name', 'email', 'roles', 'avatar', 'department'],
            order: { name: 'ASC' }
        });
        res.json({
            data: users,
            total: users.length
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
/**
 * PATCH /api/users/avatar
 * Update user avatar (predefined avatar ID)
 */
router.patch('/avatar', async (req, res) => {
    try {
        const { avatarId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Validate avatar ID format
        const validAvatarPattern = /^(male|female)-(0[1-9]|10)$/;
        if (!avatarId || !validAvatarPattern.test(avatarId)) {
            return res.status(400).json({
                error: 'Invalid avatar ID. Must be male-01 through male-10 or female-01 through female-10'
            });
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.avatar = avatarId;
        await userRepo.save(user);
        res.json({
            success: true,
            avatarId,
            message: 'Avatar updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});
/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Don't return password hash
        const { password_hash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Only allow updating specific fields
        const allowedFields = ['name', 'phone', 'department', 'position'];
        const updates = {};
        for (const field of allowedFields) {
            if (field in req.body) {
                updates[field] = req.body[field];
            }
        }
        userRepo.merge(user, updates);
        await userRepo.save(user);
        // Don't return password hash
        const { password_hash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map