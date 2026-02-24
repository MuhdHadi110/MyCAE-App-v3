import { Router, Response } from 'express';
import { TeamMember, EmploymentType } from '../entities/TeamMember';
import { UserRole } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import teamService from '../services/team.service';

const router = Router();

// All team routes require authentication
router.use(authenticate);

// Define roles that can manage team members (senior-engineer and above)
const TEAM_MANAGE_ROLES = [
  UserRole.SENIOR_ENGINEER,
  UserRole.PRINCIPAL_ENGINEER,
  UserRole.MANAGER,
  UserRole.MANAGING_DIRECTOR,
  UserRole.ADMIN,
];



/**
 * GET /api/team
 * Get all team members with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, department, search, limit = 100, offset = 0 } = req.query;

    // If status is 'all', don't filter by status (return all members)
    // If status is not provided, default to 'active'
    const statusFilter = status === 'all' ? undefined : (status as string) || 'active';

    const result = await teamService.getTeamMembers({
      status: statusFilter,
      department: department as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * GET /api/team/:id
 * Get single team member
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const member = await teamService.getTeamMemberById(req.params.id);
    res.json(member);
  } catch (error: any) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

/**
 * POST /api/team
 * Create new team member
 * Requires: senior-engineer or above
 */
router.post(
  '/',
  authorize(...TEAM_MANAGE_ROLES),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const member = await teamService.createTeamMember(req.body);
      res.status(201).json(member);
    } catch (error: any) {
      console.error('Error creating team member:', error);
      res.status(500).json({ error: 'Failed to create team member' });
    }
  }
);

/**
 * PUT /api/team/:id
 * Update team member with authorization checks
 * Senior Engineers can edit members in their own department
 * Managers and above can edit any member
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const member = await teamService.updateTeamMember(
      req.params.id,
      req.body,
      req.user?.id,
      req.user?.role
    );
    res.json(member);
  } catch (error: any) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

/**
 * DELETE /api/team/:id
 * Deactivate team member (soft delete - sets status to inactive)
 * Requires: manager or above
 */
router.delete('/:id', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const result = await teamService.deactivateTeamMember(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error deactivating team member:', error);
    res.status(500).json({ error: 'Failed to deactivate team member' });
  }
});

/**
 * POST /api/team/:id/reactivate
 * Reactivate a deactivated team member
 * Requires: manager or above
 */
router.post('/:id/reactivate', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const result = await teamService.reactivateTeamMember(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error reactivating team member:', error);
    res.status(500).json({ error: 'Failed to reactivate team member' });
  }
});

/**
 * GET /api/team/department/:department
 * Get team members by department
 */
router.get('/department/:department', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await teamService.getTeamMembersByDepartment(req.params.department, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching team members by department:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

export default router;
