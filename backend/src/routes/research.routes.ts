import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { ResearchProject } from '../entities/ResearchProject';
import { User, UserRole } from '../entities/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Protect all research routes with authentication
router.use(authenticate);

// Helper to validate and sanitize pagination params
const validatePagination = (limit: unknown, offset: unknown) => ({
  limit: Math.min(Math.max(parseInt(String(limit)) || 100, 1), 500), // Max 500 records
  offset: Math.max(parseInt(String(offset)) || 0, 0)
});

// Validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Get all research projects
router.get('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const pagination = validatePagination(limit, offset);

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const [projects, total] = await projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leadResearcher', 'leadResearcher')
      .orderBy('project.createdAt', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset)
      .getManyAndCount();

    // Get total hours for each project from research_timesheets
    const projectIds = projects.map(p => p.id);
    logger.debug('Research projects found', { count: projectIds.length });
    
    let hoursMap = new Map<string, number>();
    if (projectIds.length > 0) {
      try {
        // Check if table exists first
        const tableExists = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'research_timesheets'`
        );
        logger.debug('research_timesheets table exists', { exists: tableExists[0]?.count > 0 });
        
        if (tableExists[0]?.count > 0) {
          // Use parameterized query with IN clause - safe from SQL injection
          // TypeORM handles the parameterization automatically
          const hoursQuery = await AppDataSource
            .createQueryBuilder()
            .select('research_project_id', 'projectId')
            .addSelect('SUM(hours)', 'totalHours')
            .from('research_timesheets', 'rt')
            .where('rt.research_project_id IN (:...projectIds)', { projectIds })
            .groupBy('rt.research_project_id')
            .getRawMany();
          
          logger.debug('Hours query result', { count: hoursQuery.length });
          
          // Build hours map
          hoursQuery.forEach((row: any) => {
            hoursMap.set(row.projectId, parseFloat(row.totalHours) || 0);
          });
        }
      } catch (error) {
        logger.error('Error fetching hours', { error });
      }
    }
    
    logger.debug('Hours map built', { entries: hoursMap.size });
    
    // Transform to include lead researcher name and total hours
    const transformedProjects = projects.map(p => ({
      ...p,
      leadResearcherName: p.leadResearcher?.name || null,
      totalHoursLogged: hoursMap.get(p.id) || 0,
    }));
    
    logger.debug('Transformed projects', { count: transformedProjects.length });

    res.json({
      data: transformedProjects,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (error) {
    logger.error('Error fetching research projects', { error });
    res.status(500).json({ error: 'Failed to fetch research projects' });
  }
});

// Get research projects by status
router.get('/projects/status/:status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const pagination = validatePagination(limit, offset);

    // Validate status parameter
    const validStatuses = ['planning', 'active', 'completed', 'on_hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const [projects, total] = await projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leadResearcher', 'leadResearcher')
      .where('project.status = :status', { status })
      .orderBy('project.createdAt', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset)
      .getManyAndCount();

    res.json({
      data: projects,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (error) {
    logger.error('Error fetching research projects by status', { error });
    res.status(500).json({ error: 'Failed to fetch research projects' });
  }
});

// Get research timesheet summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { engineerId } = req.query;

    // Validate engineerId if provided
    if (engineerId && !isValidUUID(engineerId as string)) {
      return res.status(400).json({ error: 'Invalid engineerId format' });
    }

    // Use TypeORM QueryBuilder for safe parameterized queries
    let queryBuilder = AppDataSource
      .createQueryBuilder()
      .select('SUM(rt.hours)', 'totalHours')
      .addSelect('COUNT(DISTINCT rt.research_project_id)', 'activeProjects')
      .addSelect('COUNT(DISTINCT rt.research_category)', 'categories')
      .addSelect('COUNT(rt.id)', 'timesheetCount')
      .addSelect('rt.research_category', 'researchCategory')
      .addSelect('SUM(rt.hours)', 'categoryHours')
      .addSelect('rp.id', 'projectId')
      .addSelect('rp.title', 'projectTitle')
      .from('research_timesheets', 'rt')
      .leftJoin('research_projects', 'rp', 'rt.research_project_id = rp.id');

    if (engineerId) {
      queryBuilder = queryBuilder.where('rt.engineer_id = :engineerId', { engineerId });
    }

    const rows = await queryBuilder
      .groupBy('rt.research_category, rp.id')
      .getRawMany();

    // Process rows into summary format
    const totalHours = rows.reduce((sum: number, row: any) => sum + (parseFloat(row.totalHours) || 0), 0);
    const categoryBreakdown: Record<string, number> = {};
    const projectBreakdown: Record<string, { projectTitle: string; hours: number }> = {};
    const activeProjects = new Set<string>();

    // Get timesheet count with separate query
    let countQueryBuilder = AppDataSource
      .createQueryBuilder()
      .select('COUNT(id)', 'count')
      .from('research_timesheets', 'rt');

    if (engineerId) {
      countQueryBuilder = countQueryBuilder.where('rt.engineer_id = :engineerId', { engineerId });
    }

    const countResult = await countQueryBuilder.getRawOne();
    const timesheetCount = countResult?.count || 0;

    // Build breakdown data
    rows.forEach((row: any) => {
      if (row.researchCategory) {
        categoryBreakdown[row.researchCategory] = parseFloat(row.categoryHours) || 0;
      }
      if (row.projectId) {
        activeProjects.add(row.projectId);
        projectBreakdown[row.projectId] = {
          projectTitle: row.projectTitle || 'Unknown Project',
          hours: parseFloat(row.projectHours) || 0,
        };
      }
    });

    res.json({
      totalHours,
      activeProjects: activeProjects.size,
      categoryBreakdown,
      projectBreakdown,
      timesheetCount,
    });
  } catch (error) {
    logger.error('Error fetching research timesheet summary', { error });
    res.status(500).json({ error: 'Failed to fetch research timesheet summary' });
  }
});

// Get all research timesheet entries
router.get('/timesheets', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamMemberId, status, startDate, endDate } = req.query;

    // Validate UUID parameters
    if (projectId && !isValidUUID(projectId as string)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }
    if (teamMemberId && !isValidUUID(teamMemberId as string)) {
      return res.status(400).json({ error: 'Invalid teamMemberId format' });
    }

    // Use TypeORM QueryBuilder for safe parameterized queries
    let queryBuilder = AppDataSource
      .createQueryBuilder()
      .select('rt.id', 'id')
      .addSelect('rt.research_project_id', 'projectId')
      .addSelect('rt.engineer_id', 'teamMemberId')
      .addSelect('u.name', 'teamMemberName')
      .addSelect('rt.date', 'date')
      .addSelect('rt.hours', 'hoursLogged')
      .addSelect('rt.description', 'description')
      .addSelect('rt.research_category', 'researchCategory')
      .addSelect('rp.status', 'status')
      .addSelect('rt.created_at', 'createdDate')
      .addSelect('rt.updated_at', 'updatedAt')
      .addSelect('rp.title', 'projectTitle')
      .addSelect('rp.research_code', 'projectCode')
      .from('research_timesheets', 'rt')
      .leftJoin('research_projects', 'rp', 'rt.research_project_id = rp.id')
      .leftJoin('users', 'u', 'rt.engineer_id = u.id');

    // Add filters safely with parameterized queries
    if (projectId) {
      queryBuilder = queryBuilder.andWhere('rt.research_project_id = :projectId', { projectId });
    }
    if (teamMemberId) {
      queryBuilder = queryBuilder.andWhere('rt.engineer_id = :teamMemberId', { teamMemberId });
    }
    if (status) {
      // Validate status against allowed values
      const validStatuses = ['planning', 'active', 'completed', 'on_hold', 'cancelled'];
      if (!validStatuses.includes(status as string)) {
        return res.status(400).json({ error: 'Invalid status parameter' });
      }
      queryBuilder = queryBuilder.andWhere('rp.status = :status', { status });
    }
    if (startDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate as string)) {
        return res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' });
      }
      queryBuilder = queryBuilder.andWhere('rt.date >= :startDate', { startDate });
    }
    if (endDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(endDate as string)) {
        return res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' });
      }
      queryBuilder = queryBuilder.andWhere('rt.date <= :endDate', { endDate });
    }

    const timesheets = await queryBuilder
      .orderBy('rt.date', 'DESC')
      .addOrderBy('rt.created_at', 'DESC')
      .getRawMany();

    res.json(timesheets || []);
  } catch (error) {
    logger.error('Error fetching research timesheets', { error });
    res.status(500).json({ error: 'Failed to fetch research timesheets' });
  }
});

// Create new research project - Managers and above only
router.post('/projects', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const {
      researchCode, title, description, status,
      startDate, plannedEndDate, leadResearcherId,
      budget, fundingSource, category, objectives, methodology
    } = req.body;

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const project = projectRepo.create({
      id: uuidv4(),
      researchCode,
      title,
      description: description || null,
      status: status || 'planning',
      startDate: startDate ? new Date(startDate) : null,
      plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
      leadResearcherId: leadResearcherId || null,
      budget: budget || null,
      fundingSource: fundingSource || null,
      category: category || null,
      objectives: objectives || null,
      methodology: methodology || null,
    });

    await projectRepo.save(project);

    // Fetch the created project with leadResearcher joined
    const createdProject = await projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.leadResearcher', 'leadResearcher')
      .where('project.id = :id', { id: project.id })
      .getOne();

    // Transform to include lead researcher name
    const transformedProject = {
      ...createdProject,
      leadResearcherName: createdProject?.leadResearcher?.name || null,
    };

    res.status(201).json(transformedProject);
  } catch (error) {
    logger.error('Error creating research project', { error });
    res.status(500).json({ error: 'Failed to create research project' });
  }
});

// Update research project - Managers and above only
router.put('/projects/:id', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }
    
    const {
      title, description, status, startDate, plannedEndDate, actualEndDate,
      leadResearcherId, budget, fundingSource, category, objectives,
      methodology, findings, publications, teamMembers, collaborators,
      equipmentUsed, notes
    } = req.body;

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const project = await projectRepo.findOne({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Research project not found' });
    }

    // Update fields if provided
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description || null;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (plannedEndDate !== undefined) project.plannedEndDate = plannedEndDate ? new Date(plannedEndDate) : null;
    if (actualEndDate !== undefined) project.actualEndDate = actualEndDate ? new Date(actualEndDate) : null;
    if (leadResearcherId !== undefined) project.leadResearcherId = leadResearcherId || null;
    if (budget !== undefined) project.budget = budget || null;
    if (fundingSource !== undefined) project.fundingSource = fundingSource || null;
    if (category !== undefined) project.category = category || null;
    if (objectives !== undefined) project.objectives = objectives || null;
    if (methodology !== undefined) project.methodology = methodology || null;
    if (findings !== undefined) project.findings = findings || null;
    if (publications !== undefined) project.publications = publications || null;
    if (teamMembers !== undefined) project.teamMembers = teamMembers || null;
    if (collaborators !== undefined) project.collaborators = collaborators || null;
    if (equipmentUsed !== undefined) project.equipmentUsed = equipmentUsed || null;
    if (notes !== undefined) project.notes = notes || null;

    await projectRepo.save(project);

    res.json(project);
  } catch (error) {
    logger.error('Error updating research project', { error });
    res.status(500).json({ error: 'Failed to update research project' });
  }
});

// Delete research project - Managers and above only
router.delete('/projects/:id', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const project = await projectRepo.findOne({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Research project not found' });
    }

    // Use transaction to ensure atomicity
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Delete timesheets first using QueryBuilder for safety
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from('research_timesheets')
        .where('research_project_id = :id', { id })
        .execute();

      // Then delete project
      await transactionalEntityManager.remove(project);
    });

    res.json({ message: 'Research project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting research project', { error });
    res.status(500).json({ error: 'Failed to delete research project' });
  }
});

// Log timesheet hours
router.post('/timesheets', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamMemberId, date, hoursLogged, description, researchCategory } = req.body;
    
    // Validate required fields
    if (!projectId || !date || hoursLogged === undefined) {
      return res.status(400).json({ error: 'Missing required fields: projectId, date, hoursLogged' });
    }
    
    // Validate UUIDs
    if (!isValidUUID(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
    }
    if (teamMemberId && !isValidUUID(teamMemberId)) {
      return res.status(400).json({ error: 'Invalid teamMemberId format' });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Validate hours
    const hours = parseFloat(hoursLogged);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      return res.status(400).json({ error: 'Hours must be between 0 and 24' });
    }
    
    const id = uuidv4();
    
    // Prevent IDOR: Engineers can only log hours for themselves
    // Only managers and above can log hours for other users
    const currentUser = req.user!;
    const isManagerOrAbove = [UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN].includes(currentUser.role);
    
    // If teamMemberId is provided and user is not a manager, reject or use current user
    let engineerId: string;
    if (teamMemberId && teamMemberId !== currentUser.id) {
      if (!isManagerOrAbove) {
        return res.status(403).json({ error: 'You can only log hours for yourself' });
      }
      engineerId = teamMemberId;
    } else {
      engineerId = currentUser.id;
    }

    // Use TypeORM QueryBuilder for safe INSERT
    await AppDataSource
      .createQueryBuilder()
      .insert()
      .into('research_timesheets')
      .values({
        id,
        research_project_id: projectId,
        engineer_id: engineerId,
        date,
        hours: hoursLogged,
        research_category: researchCategory || null,
        description: description || null,
      })
      .execute();

    res.status(201).json({ id, projectId, engineerId, date, hoursLogged, description, researchCategory });
  } catch (error) {
    logger.error('Error logging timesheet hours', { error });
    res.status(500).json({ error: 'Failed to log timesheet hours' });
  }
});

// Approve timesheet entry - Managers and above only
router.put('/timesheets/:id/approve', authorize(UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid timesheet ID format' });
    }

    // Use TypeORM QueryBuilder for safe UPDATE
    const result = await AppDataSource
      .createQueryBuilder()
      .update('research_timesheets')
      .set({ status: 'approved' })
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Timesheet entry not found' });
    }

    res.json({ message: 'Timesheet entry approved' });
  } catch (error) {
    logger.error('Error approving timesheet entry', { error });
    res.status(500).json({ error: 'Failed to approve timesheet entry' });
  }
});

// Delete timesheet entry - Users can delete their own, managers can delete any
router.delete('/timesheets/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid timesheet ID format' });
    }
    
    const currentUser = req.user!;
    const isManagerOrAbove = [UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN].includes(currentUser.role);

    // Check ownership before deletion (prevent IDOR)
    if (!isManagerOrAbove) {
      const timesheet = await AppDataSource
        .createQueryBuilder()
        .select('engineer_id', 'engineerId')
        .from('research_timesheets', 'rt')
        .where('rt.id = :id', { id })
        .getRawOne();
      
      if (!timesheet) {
        return res.status(404).json({ error: 'Timesheet entry not found' });
      }
      
      if (timesheet.engineerId !== currentUser.id) {
        return res.status(403).json({ error: 'You can only delete your own timesheet entries' });
      }
    }

    // Delete timesheet entry using QueryBuilder
    const result = await AppDataSource
      .createQueryBuilder()
      .delete()
      .from('research_timesheets')
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Timesheet entry not found' });
    }

    res.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting timesheet entry', { error });
    res.status(500).json({ error: 'Failed to delete timesheet entry' });
  }
});

export default router;
