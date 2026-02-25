"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../entities/User");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const team_service_1 = __importDefault(require("../services/team.service"));
const router = (0, express_1.Router)();
// All team routes require authentication
router.use(auth_1.authenticate);
// Define roles that can manage team members (senior-engineer and above)
const TEAM_MANAGE_ROLES = [
    User_1.UserRole.SENIOR_ENGINEER,
    User_1.UserRole.PRINCIPAL_ENGINEER,
    User_1.UserRole.MANAGER,
    User_1.UserRole.MANAGING_DIRECTOR,
    User_1.UserRole.ADMIN,
];
/**
 * GET /api/team
 * Get all team members with filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, department, search, limit = 100, offset = 0 } = req.query;
        // If status is 'all', don't filter by status (return all members)
        // If status is not provided, default to 'active'
        const statusFilter = status === 'all' ? undefined : status || 'active';
        const result = await team_service_1.default.getTeamMembers({
            status: statusFilter,
            department: department,
            search: search,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});
/**
 * GET /api/team/:id
 * Get single team member
 */
router.get('/:id', async (req, res) => {
    try {
        const member = await team_service_1.default.getTeamMemberById(req.params.id);
        res.json(member);
    }
    catch (error) {
        console.error('Error fetching team member:', error);
        res.status(500).json({ error: 'Failed to fetch team member' });
    }
});
/**
 * POST /api/team
 * Create new team member
 * Requires: senior-engineer or above
 */
router.post('/', (0, auth_1.authorize)(...TEAM_MANAGE_ROLES), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const member = await team_service_1.default.createTeamMember(req.body);
        res.status(201).json(member);
    }
    catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ error: 'Failed to create team member' });
    }
});
/**
 * PUT /api/team/:id
 * Update team member with authorization checks
 * Senior Engineers can edit members in their own department
 * Managers and above can edit any member
 */
router.put('/:id', async (req, res) => {
    try {
        const member = await team_service_1.default.updateTeamMember(req.params.id, req.body, req.user?.id, req.user?.role);
        res.json(member);
    }
    catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({ error: 'Failed to update team member' });
    }
});
/**
 * DELETE /api/team/:id
 * Deactivate team member (soft delete - sets status to inactive)
 * Requires: manager or above
 */
router.delete('/:id', (0, auth_1.authorize)(User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const result = await team_service_1.default.deactivateTeamMember(req.params.id);
        res.json(result);
    }
    catch (error) {
        console.error('Error deactivating team member:', error);
        res.status(500).json({ error: 'Failed to deactivate team member' });
    }
});
/**
 * POST /api/team/:id/reactivate
 * Reactivate a deactivated team member
 * Requires: manager or above
 */
router.post('/:id/reactivate', (0, auth_1.authorize)(User_1.UserRole.MANAGER, User_1.UserRole.MANAGING_DIRECTOR, User_1.UserRole.ADMIN), async (req, res) => {
    try {
        const result = await team_service_1.default.reactivateTeamMember(req.params.id);
        res.json(result);
    }
    catch (error) {
        console.error('Error reactivating team member:', error);
        res.status(500).json({ error: 'Failed to reactivate team member' });
    }
});
/**
 * GET /api/team/department/:department
 * Get team members by department
 */
router.get('/department/:department', async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        const result = await team_service_1.default.getTeamMembersByDepartment(req.params.department, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching team members by department:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});
exports.default = router;
//# sourceMappingURL=team.routes.js.map