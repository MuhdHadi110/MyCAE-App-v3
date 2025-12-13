import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { TeamMember, EmploymentType } from '../entities/TeamMember';
import { User, UserRole } from '../entities/User';
import { Project } from '../entities/Project';
import { Timesheet } from '../entities/Timesheet';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

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
 * Helper function to calculate workload data for team members
 */
async function calculateWorkloadData(userIds: string[]) {
  const projectRepo = AppDataSource.getRepository(Project);
  const timesheetRepo = AppDataSource.getRepository(Timesheet);

  // Get current month's start and end dates
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate active projects per user
  const activeProjectsQuery = await projectRepo
    .createQueryBuilder('project')
    .select('project.lead_engineer_id', 'userId')
    .addSelect('COUNT(project.id)', 'count')
    .where('project.lead_engineer_id IN (:...userIds)', { userIds })
    .andWhere('project.status = :status', { status: 'ongoing' })
    .groupBy('project.lead_engineer_id')
    .getRawMany();

  // Calculate hours this month per user
  const hoursQuery = await timesheetRepo
    .createQueryBuilder('timesheet')
    .select('timesheet.engineer_id', 'userId')
    .addSelect('SUM(timesheet.hours)', 'hours')
    .where('timesheet.engineer_id IN (:...userIds)', { userIds })
    .andWhere('timesheet.date >= :startDate', { startDate: startOfMonth })
    .andWhere('timesheet.date <= :endDate', { endDate: endOfMonth })
    .groupBy('timesheet.engineer_id')
    .getRawMany();

  // Create a map for easy lookup
  const workloadMap: Record<string, { activeProjects: number; totalHoursThisMonth: number }> = {};

  userIds.forEach(userId => {
    workloadMap[userId] = { activeProjects: 0, totalHoursThisMonth: 0 };
  });

  activeProjectsQuery.forEach((row) => {
    workloadMap[row.userId] = workloadMap[row.userId] || { activeProjects: 0, totalHoursThisMonth: 0 };
    workloadMap[row.userId].activeProjects = parseInt(row.count);
  });

  hoursQuery.forEach((row) => {
    workloadMap[row.userId] = workloadMap[row.userId] || { activeProjects: 0, totalHoursThisMonth: 0 };
    workloadMap[row.userId].totalHoursThisMonth = parseFloat(row.hours) || 0;
  });

  return workloadMap;
}

/**
 * GET /api/team
 * Get all team members with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'active', department, search, limit = 100, offset = 0 } = req.query;
    const teamRepo = AppDataSource.getRepository(TeamMember);

    let query = teamRepo.createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .orderBy('user.name', 'ASC');

    if (status) {
      query = query.where('member.status = :status', { status });
    }

    if (department) {
      query = query.andWhere('member.department = :department', { department });
    }

    if (search) {
      query = query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR member.employee_id LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [members, total] = await query
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    // Get user IDs for workload calculation
    const userIds = members.map(m => m.user?.id).filter(Boolean) as string[];
    const workloadMap = userIds.length > 0 ? await calculateWorkloadData(userIds) : {};

    // Convert to plain JSON to ensure enum fields are serialized correctly
    const plainMembers = members.map(member => {
      const userId = member.user?.id;
      const workload = userId ? workloadMap[userId] : { activeProjects: 0, totalHoursThisMonth: 0 };

      return {
        ...member,
        activeProjects: workload?.activeProjects || 0,
        totalHoursThisMonth: workload?.totalHoursThisMonth || 0,
        user: member.user ? {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          department: member.user.department,
          position: member.user.position,
          avatar: member.user.avatar,
        } : null,
      };
    });

    res.json({
      data: plainMembers,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
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
    const teamRepo = AppDataSource.getRepository(TeamMember);
    const member = await teamRepo.findOne({
      where: { id: req.params.id },
      relations: ['user'],
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Convert to plain JSON to ensure enum fields are serialized correctly
    const plainMember = {
      ...member,
      user: member.user ? {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.user.role,
        department: member.user.department,
        position: member.user.position,
        avatar: member.user.avatar,
      } : null,
    };

    res.json(plainMember);
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

      const { name, email, phone, role = 'engineer', department, employment_type = EmploymentType.FULL_TIME, userId, ...rest } = req.body;
      const userRepo = AppDataSource.getRepository(User);
      const teamRepo = AppDataSource.getRepository(TeamMember);

      let user;

      // If userId is provided, use existing user
      if (userId) {
        user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
          return res.status(400).json({ error: 'User not found' });
        }
      } else {
        // Create new user if name and email provided
        const existingUser = await userRepo.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Generate temporary password (hash it)
        const bcrypt = require('bcryptjs');
        const tempPassword = 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user = userRepo.create({
          name,
          email,
          password_hash: hashedPassword,
          role: role as UserRole,
        });

        await userRepo.save(user);
      }

      // Check if team member already exists for this user
      const existing = await teamRepo.findOne({ where: { user_id: user.id } });
      if (existing) {
        return res.status(400).json({ error: 'Team member already exists for this user' });
      }

      const member = teamRepo.create({
        user_id: user.id,
        phone,
        department,
        status: 'active',
        employment_type,
        ...rest,
      });

      const savedMember = await teamRepo.save(member);

      const fullMember = await teamRepo.findOne({
        where: { id: (savedMember as unknown as TeamMember).id },
        relations: ['user'],
      });

      // Return response with temporary password for new users
      const response: any = fullMember;
      if (!userId) {
        // Only return temp password if we created a new user
        response.tempPassword = 'TempPassword123!';
        response.message = `New user created. Share this temporary password with the team member and ask them to change it on first login.`;
      }

      res.status(201).json(response);
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
    const teamRepo = AppDataSource.getRepository(TeamMember);
    const member = await teamRepo.findOne({
      where: { id: req.params.id },
      relations: ['user'],
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Authorization checks
    const userRole = req.user?.role || 'engineer';

    // Admin and Manager can edit anyone
    if (userRole === 'admin' || userRole === 'manager') {
      // Allow edit
    }
    // Senior Engineer and Principal Engineer can only edit team members in their own department
    else if (userRole === 'senior-engineer' || userRole === 'principal-engineer') {
      // Get the current user's team member record to find their department
      const currentUserTeam = await teamRepo.findOne({
        where: { user_id: req.user?.id },
      });

      if (!currentUserTeam || currentUserTeam.department !== member.department) {
        return res.status(403).json({
          error: 'Senior Engineers can only edit team members in their own department'
        });
      }
    }
    // Engineers cannot edit team members
    else {
      return res.status(403).json({
        error: 'You do not have permission to edit team members'
      });
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = member.user;

    if (!user) {
      return res.status(400).json({ error: 'User not found for this team member' });
    }

    // Separate user fields from team member fields
    const { role, name, email, phone, department, ...teamMemberFields } = req.body;

    console.log('=== UPDATE TEAM MEMBER START ===');
    console.log('Update request:', { role, name, email, phone, department });

    // Update User table fields (name, email, role)
    let userUpdated = false;
    if (name && name !== user.name) {
      user.name = name;
      userUpdated = true;
    }
    if (email && email !== user.email) {
      user.email = email;
      userUpdated = true;
    }
    if (role) {
      const validRoles = [
        UserRole.ENGINEER,
        UserRole.SENIOR_ENGINEER,
        UserRole.PRINCIPAL_ENGINEER,
        UserRole.MANAGER,
        UserRole.MANAGING_DIRECTOR,
        UserRole.ADMIN,
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }
      user.role = role as UserRole;
      userUpdated = true;
    }

    if (userUpdated) {
      console.log('Updating user fields:', { name: user.name, email: user.email, role: user.role });
      await userRepo.save(user);
      member.user = user;
    }

    // Update TeamMember table fields (phone, department, etc.)
    let teamMemberUpdated = false;
    if (phone !== undefined) {
      member.phone = phone;
      teamMemberUpdated = true;
    }
    if (department && department !== member.department) {
      member.department = department;
      teamMemberUpdated = true;
    }

    // Update any other team member fields
    if (Object.keys(teamMemberFields).length > 0) {
      teamRepo.merge(member, teamMemberFields);
      teamMemberUpdated = true;
    }

    if (teamMemberUpdated) {
      console.log('Updating team member fields:', { phone: member.phone, department: member.department });
      await teamRepo.save(member);
    }

    console.log('=== UPDATE TEAM MEMBER END ===');

    // Return the updated member with the user object that we've already modified
    console.log('About to return member with user role:', member.user?.role);
    console.log('Member user object:', JSON.stringify(member.user, null, 2));

    // Convert to plain JSON to ensure enum fields are serialized correctly
    const responseData = {
      ...member,
      user: member.user ? {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.user.role,
        department: member.user.department,
        position: member.user.position,
        avatar: member.user.avatar,
      } : null,
    };

    console.log('Final response data:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error: any) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

/**
 * DELETE /api/team/:id
 * Delete team member (soft delete)
 * Requires: manager or above
 */
router.delete('/:id', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const teamRepo = AppDataSource.getRepository(TeamMember);
    const member = await teamRepo.findOne({ where: { id: req.params.id } });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Soft delete - mark as inactive
    member.status = 'inactive';
    await teamRepo.save(member);

    res.json({ message: 'Team member deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

/**
 * GET /api/team/department/:department
 * Get team members by department
 */
router.get('/department/:department', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const teamRepo = AppDataSource.getRepository(TeamMember);

    const [members, total] = await teamRepo
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.department = :department', { department: req.params.department })
      .andWhere('member.status = :status', { status: 'active' })
      .orderBy('user.name', 'ASC')
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    // Get user IDs for workload calculation
    const userIds = members.map(m => m.user?.id).filter(Boolean) as string[];
    const workloadMap = userIds.length > 0 ? await calculateWorkloadData(userIds) : {};

    // Convert to plain JSON to ensure enum fields are serialized correctly
    const plainMembers = members.map(member => {
      const userId = member.user?.id;
      const workload = userId ? workloadMap[userId] : { activeProjects: 0, totalHoursThisMonth: 0 };

      return {
        ...member,
        activeProjects: workload?.activeProjects || 0,
        totalHoursThisMonth: workload?.totalHoursThisMonth || 0,
        user: member.user ? {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          department: member.user.department,
          position: member.user.position,
          avatar: member.user.avatar,
        } : null,
      };
    });

    res.json({
      data: plainMembers,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching team members by department:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

export default router;
