import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ProjectTeamMember, ProjectTeamRole } from '../entities/ProjectTeamMember';
import { Project } from '../entities/Project';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects/team-assignments
 * Get all team assignments across all projects (for workload calculation)
 * MUST be defined BEFORE /:projectId/team to avoid route conflict
 */
router.get('/team-assignments', async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Fetching team assignments from timesheets, project_team_members, and projects');
    
    // Primary source: Get unique project assignments from timesheets
    // engineer_id in timesheets is actually user_id, so we need to join with team_members
    const timesheetAssignments = await AppDataSource
      .createQueryBuilder()
      .select('tm.id', 'teamMemberId')
      .addSelect('tm.user_id', 'userId')
      .addSelect('t.project_id', 'projectId')
      .addSelect('p.project_code', 'projectCode')
      .addSelect('p.title', 'projectTitle')
      .addSelect('p.status', 'projectStatus')
      .addSelect('p.lead_engineer_id', 'leadEngineerId')
      .from('timesheets', 't')
      .leftJoin('team_members', 'tm', 't.engineer_id = tm.user_id')
      .leftJoin('projects', 'p', 't.project_id = p.id')
      .groupBy('tm.id')
      .addGroupBy('tm.user_id')
      .addGroupBy('t.project_id')
      .addGroupBy('p.project_code')
      .addGroupBy('p.title')
      .addGroupBy('p.status')
      .addGroupBy('p.lead_engineer_id')
      .getRawMany();

    logger.info(`Found ${timesheetAssignments.length} assignments from timesheets`);
    
    // Secondary source: Get assignments from project_team_members table
    const teamMemberAssignments = await AppDataSource
      .createQueryBuilder()
      .select('ptm.team_member_id', 'teamMemberId')
      .addSelect('ptm.project_id', 'projectId')
      .addSelect('ptm.role', 'role')
      .addSelect('p.project_code', 'projectCode')
      .addSelect('p.title', 'projectTitle')
      .addSelect('p.status', 'projectStatus')
      .addSelect('p.lead_engineer_id', 'leadEngineerId')
      .from('project_team_members', 'ptm')
      .leftJoin('projects', 'p', 'ptm.project_id = p.id')
      .getRawMany();

    logger.info(`Found ${teamMemberAssignments.length} assignments from project_team_members`);
    
    // Tertiary source: Get lead engineers from projects table
    // lead_engineer_id is user_id, so join with team_members to get team_member_id
    const projectsWithLeads = await AppDataSource
      .createQueryBuilder()
      .select('p.id', 'projectId')
      .addSelect('p.project_code', 'projectCode')
      .addSelect('p.title', 'projectTitle')
      .addSelect('p.status', 'projectStatus')
      .addSelect('tm.id', 'teamMemberId')
      .from('projects', 'p')
      .leftJoin('team_members', 'tm', 'p.lead_engineer_id = tm.user_id')
      .where('p.lead_engineer_id IS NOT NULL')
      .andWhere("p.lead_engineer_id != ''")
      .getRawMany();
    
    logger.info(`Found ${projectsWithLeads.length} projects with lead engineers`);

    // Group by engineer ID
    const groupedByMember: Record<string, any[]> = {};
    
    // Helper function to add assignment
    const addAssignment = (engineerId: string, projectData: any, role: string) => {
      if (!groupedByMember[engineerId]) {
        groupedByMember[engineerId] = [];
      }
      
      // Check if already added (avoid duplicates)
      const existing = groupedByMember[engineerId].find((a: any) => a.projectId === projectData.projectId);
      if (!existing) {
        groupedByMember[engineerId].push({
          projectId: projectData.projectId,
          projectCode: projectData.projectCode,
          projectTitle: projectData.projectTitle,
          role: role,
          status: projectData.projectStatus,
        });
      }
    };
    
    // Add timesheet-based assignments
    timesheetAssignments.forEach((assignment: any) => {
      if (!assignment.teamMemberId) {
        logger.warn(`Timesheet assignment has no matching team member: project_id=${assignment.projectId}`);
        return;
      }
      // Determine role based on lead_engineer_id
      // lead_engineer_id is user_id, so compare with the team member's user_id
      const isLead = assignment.leadEngineerId === assignment.userId;
      const role = isLead ? 'lead_engineer' : 'engineer';
      addAssignment(assignment.teamMemberId, assignment, role);
    });
    
    // Add project_team_members assignments
    teamMemberAssignments.forEach((assignment: any) => {
      addAssignment(assignment.teamMemberId, assignment, assignment.role);
    });
    
    // Add lead engineer assignments from projects
    projectsWithLeads.forEach((project: any) => {
      if (!project.teamMemberId) {
        logger.warn(`Lead engineer assignment has no matching team member: project_id=${project.projectId}`);
        return;
      }
      addAssignment(project.teamMemberId, project, 'lead_engineer');
    });

    logger.info(`Grouped assignments for ${Object.keys(groupedByMember).length} members total`);
    res.json(groupedByMember);
  } catch (error) {
    logger.error('Error fetching team assignments', { error });
    res.status(500).json({ error: 'Failed to fetch team assignments' });
  }
});

/**
 * GET /api/projects/:projectId/team
 * Get all team members for a project
 */
router.get('/:projectId/team', async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  try {
    const teamMembers = await AppDataSource.getRepository(ProjectTeamMember)
      .createQueryBuilder('ptm')
      .leftJoinAndSelect('ptm.teamMember', 'tm')
      .leftJoinAndSelect('tm.user', 'u')
      .where('ptm.project_id = :projectId', { projectId })
      .orderBy("CASE WHEN ptm.role = 'lead_engineer' THEN 0 ELSE 1 END", 'ASC')
      .addOrderBy('u.name', 'ASC')
      .getMany();

    const formatted = teamMembers.map((ptm) => ({
      id: ptm.id,
      teamMemberId: ptm.team_member_id,
      role: ptm.role,
      name: ptm.teamMember?.user?.name || 'Unknown',
      email: ptm.teamMember?.user?.email || '',
      department: ptm.teamMember?.department || '',
      avatar: ptm.teamMember?.user?.avatar || 'male-01',
    }));

      res.json(formatted);
    } catch (error) {
      logger.error('Error fetching project team', { error, projectId });
      res.status(500).json({ error: 'Failed to fetch project team' });
    }
});

/**
 * POST /api/projects/:projectId/team
 * Add a team member to a project
 * Requires: manager or admin
 */
router.post(
  '/:projectId/team',
  authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { teamMemberId, role = ProjectTeamRole.ENGINEER } = req.body;

    try {

      if (!teamMemberId) {
        return res.status(400).json({ error: 'Team member ID is required' });
      }

      // Check if project exists
      const project = await AppDataSource.getRepository(Project).findOne({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if already assigned
      const existing = await AppDataSource.getRepository(ProjectTeamMember).findOne({
        where: { project_id: projectId, team_member_id: teamMemberId },
      });

      if (existing) {
        return res.status(409).json({ error: 'Team member already assigned to this project' });
      }

      // Use transaction to prevent race conditions when checking/saving lead engineer
      let newMemberId: string;
      try {
        const savedMember = await AppDataSource.transaction(async (transactionalEntityManager) => {
          // If assigning as lead, check if lead already exists (within transaction)
          if (role === ProjectTeamRole.LEAD_ENGINEER) {
            const existingLead = await transactionalEntityManager.findOne(ProjectTeamMember, {
              where: { project_id: projectId, role: ProjectTeamRole.LEAD_ENGINEER },
            });

            if (existingLead) {
              throw new Error('LEAD_EXISTS');
            }
          }

          // Create team member assignment
          const projectTeamMember = transactionalEntityManager.create(ProjectTeamMember, {
            project_id: projectId,
            team_member_id: teamMemberId,
            role: role as ProjectTeamRole,
          });

          const saved = await transactionalEntityManager.save(projectTeamMember);
          return saved;
        });
        
        newMemberId = savedMember.id;
      } catch (error: any) {
        if (error.message === 'LEAD_EXISTS') {
          return res.status(409).json({ error: 'Project already has a lead engineer' });
        }
        throw error;
      }

      // Fetch the complete data with relations
      const savedMemberWithRelations = await AppDataSource.getRepository(ProjectTeamMember)
        .createQueryBuilder('ptm')
        .leftJoinAndSelect('ptm.teamMember', 'tm')
        .leftJoinAndSelect('tm.user', 'u')
        .where('ptm.id = :id', { id: newMemberId })
        .getOne();

      res.status(201).json({
        id: savedMemberWithRelations?.id,
        teamMemberId: savedMemberWithRelations?.team_member_id,
        role: savedMemberWithRelations?.role,
        name: savedMemberWithRelations?.teamMember?.user?.name || 'Unknown',
        email: savedMemberWithRelations?.teamMember?.user?.email || '',
        department: savedMemberWithRelations?.teamMember?.department || '',
        avatar: savedMemberWithRelations?.teamMember?.user?.avatar || 'male-01',
      });
    } catch (error) {
      logger.error('Error adding team member', { error, projectId, teamMemberId });
      res.status(500).json({ error: 'Failed to add team member' });
    }
  }
);

/**
 * PUT /api/projects/:projectId/team/:teamMemberId
 * Update team member role (change lead)
 */
router.put(
  '/:projectId/team/:teamMemberId',
  authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const { projectId, teamMemberId } = req.params;

    try {
      const { role } = req.body;

      const projectTeamMember = await AppDataSource.getRepository(ProjectTeamMember).findOne({
        where: { project_id: projectId, team_member_id: teamMemberId },
      });

      if (!projectTeamMember) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      // If promoting to lead, demote existing lead
      if (role === ProjectTeamRole.LEAD_ENGINEER) {
        const existingLead = await AppDataSource.getRepository(ProjectTeamMember).findOne({
          where: { project_id: projectId, role: ProjectTeamRole.LEAD_ENGINEER },
        });

        if (existingLead && existingLead.id !== projectTeamMember.id) {
          existingLead.role = ProjectTeamRole.ENGINEER;
          await AppDataSource.getRepository(ProjectTeamMember).save(existingLead);
        }
      }

      projectTeamMember.role = role;
      await AppDataSource.getRepository(ProjectTeamMember).save(projectTeamMember);

      res.json({
        id: projectTeamMember.id,
        teamMemberId: projectTeamMember.team_member_id,
        role: projectTeamMember.role,
      });
    } catch (error) {
      logger.error('Error updating team member', { error, projectId, teamMemberId });
      res.status(500).json({ error: 'Failed to update team member' });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/team/:teamMemberId
 * Remove a team member from project
 */
router.delete(
  '/:projectId/team/:teamMemberId',
  authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const { projectId, teamMemberId } = req.params;

    try {

      const result = await AppDataSource.getRepository(ProjectTeamMember).delete({
        project_id: projectId,
        team_member_id: teamMemberId,
      });

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      res.json({ message: 'Team member removed successfully' });
    } catch (error) {
      logger.error('Error removing team member', { error, projectId, teamMemberId });
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  }
);

export default router;
