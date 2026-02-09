import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { ResearchProject } from '../entities/ResearchProject';
import { User } from '../entities/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Protect all research routes with authentication
router.use(authenticate);

// Helper to validate and sanitize pagination params
const validatePagination = (limit: unknown, offset: unknown) => ({
  limit: Math.min(Math.max(parseInt(String(limit)) || 100, 1), 500), // Max 500 records
  offset: Math.max(parseInt(String(offset)) || 0, 0)
});

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
    console.log('Research projects found:', projectIds);
    
    let hoursMap = new Map<string, number>();
    if (projectIds.length > 0) {
      try {
        // Check if table exists first
        const tableExists = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'research_timesheets'`
        );
        console.log('research_timesheets table exists:', tableExists);
        
        if (tableExists[0]?.count > 0) {
          // Build the IN clause manually for MySQL
          const placeholders = projectIds.map(() => '?').join(',');
          
          // Get all timesheets for these projects
          const hoursQuery = await AppDataSource.query(
            `SELECT research_project_id as projectId, SUM(hours) as totalHours 
             FROM research_timesheets 
             WHERE research_project_id IN (${placeholders}) 
             GROUP BY research_project_id`,
            projectIds
          );
          console.log('Hours query result:', hoursQuery);
          
          // Build hours map
          hoursQuery.forEach((row: any) => {
            hoursMap.set(row.projectId, parseFloat(row.totalHours) || 0);
          });
          
          // Also check raw data
          const rawData = await AppDataSource.query(
            `SELECT * FROM research_timesheets WHERE research_project_id IN (${placeholders})`,
            projectIds
          );
          console.log('Raw timesheet data count:', rawData.length);
          console.log('Raw timesheet data:', rawData);
        } else {
          console.log('research_timesheets table does not exist');
        }
      } catch (error) {
        console.error('Error fetching hours:', error);
      }
    }
    
    console.log('Hours map:', Array.from(hoursMap.entries()));
    
    // Transform to include lead researcher name and total hours
    const transformedProjects = projects.map(p => ({
      ...p,
      leadResearcherName: p.leadResearcher?.name || null,
      totalHoursLogged: hoursMap.get(p.id) || 0,
    }));
    
    console.log('Transformed projects with hours:', transformedProjects.map(p => ({ id: p.id, totalHoursLogged: p.totalHoursLogged })));

    res.json({
      data: transformedProjects,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (error) {
    console.error('Error fetching research projects:', error);
    res.status(500).json({ error: 'Failed to fetch research projects' });
  }
});

// Get research projects by status
router.get('/projects/status/:status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const pagination = validatePagination(limit, offset);

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
    console.error('Error fetching research projects by status:', error);
    res.status(500).json({ error: 'Failed to fetch research projects' });
  }
});

// Get research timesheet summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { engineerId } = req.query;

    let query = `
      SELECT
        SUM(rt.hoursLogged) as totalHours,
        COUNT(DISTINCT rt.projectId) as activeProjects,
        COUNT(DISTINCT rt.researchCategory) as categories,
        COUNT(rt.id) as timesheetCount,
        rt.researchCategory,
        SUM(rt.hoursLogged) as categoryHours,
        rp.id as projectId,
        rp.title as projectTitle,
        SUM(rt.hoursLogged) as projectHours
      FROM research_timesheets rt
      LEFT JOIN research_projects rp ON rt.projectId = rp.id
    `;

    if (engineerId) {
      query += ` WHERE rt.teamMemberId = ?`;
    }

    query += ` GROUP BY rt.researchCategory, rp.id`;

    const rows = await AppDataSource.query(query, engineerId ? [engineerId] : []);

    // Process rows into summary format
    const totalHours = rows.reduce((sum: number, row: any) => sum + (parseFloat(row.totalHours) || 0), 0);
    const categoryBreakdown: Record<string, number> = {};
    const projectBreakdown: Record<string, { projectTitle: string; hours: number }> = {};
    let timesheetCount = 0;
    const activeProjects = new Set<string>();

    // Get timesheet count
    let countQuery = `SELECT COUNT(id) as count FROM research_timesheets`;
    if (engineerId) {
      countQuery += ` WHERE teamMemberId = ?`;
    }
    const countResult = await AppDataSource.query(countQuery, engineerId ? [engineerId] : []);
    timesheetCount = countResult[0]?.count || 0;

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
    console.error('Error fetching research timesheet summary:', error);
    res.status(500).json({ error: 'Failed to fetch research timesheet summary' });
  }
});

// Get all research timesheet entries
router.get('/timesheets', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamMemberId, status, startDate, endDate } = req.query;

    let query = `
      SELECT
        rt.id,
        rt.research_project_id as projectId,
        rt.engineer_id as teamMemberId,
        u.name as teamMemberName,
        rt.date,
        rt.hours as hoursLogged,
        rt.description,
        rt.research_category as researchCategory,
        rp.status as status,
        rt.created_at as createdDate,
        rt.updated_at as updatedAt,
        rp.title as projectTitle,
        rp.research_code as projectCode
      FROM research_timesheets rt
      LEFT JOIN research_projects rp ON rt.research_project_id = rp.id
      LEFT JOIN users u ON rt.engineer_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (projectId) { query += ` AND rt.research_project_id = ?`; params.push(projectId); }
    if (teamMemberId) { query += ` AND rt.engineer_id = ?`; params.push(teamMemberId); }
    if (status) { query += ` AND rp.status = ?`; params.push(status); }
    if (startDate) { query += ` AND rt.date >= ?`; params.push(startDate); }
    if (endDate) { query += ` AND rt.date <= ?`; params.push(endDate); }

    query += ` ORDER BY rt.date DESC, rt.created_at DESC`;

    const timesheets = await AppDataSource.query(query, params);
    res.json(timesheets || []);
  } catch (error) {
    console.error('Error fetching research timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch research timesheets' });
  }
});

// Create new research project
router.post('/projects', async (req: AuthRequest, res: Response) => {
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
    console.error('Error creating research project:', error);
    res.status(500).json({ error: 'Failed to create research project' });
  }
});

// Update research project
router.put('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
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
    console.error('Error updating research project:', error);
    res.status(500).json({ error: 'Failed to update research project' });
  }
});

// Delete research project
router.delete('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const projectRepo = AppDataSource.getRepository(ResearchProject);
    const project = await projectRepo.findOne({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Research project not found' });
    }

    // Delete timesheets first (no entity, use raw SQL)
    await AppDataSource.query(`DELETE FROM research_timesheets WHERE research_project_id = ?`, [id]);

    // Then delete project
    await projectRepo.remove(project);

    res.json({ message: 'Research project deleted successfully' });
  } catch (error) {
    console.error('Error deleting research project:', error);
    res.status(500).json({ error: 'Failed to delete research project' });
  }
});

// Log timesheet hours
router.post('/timesheets', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamMemberId, date, hoursLogged, description, researchCategory } = req.body;
    const id = uuidv4();
    const engineerId = teamMemberId || req.user!.id; // Use teamMemberId if provided, otherwise current user

    const query = `
      INSERT INTO research_timesheets
      (id, research_project_id, engineer_id, date, hours, research_category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await AppDataSource.query(query, [
      id,
      projectId,
      engineerId,
      date,
      hoursLogged,
      researchCategory || null,
      description || null,
    ]);

    res.status(201).json({ id, projectId, engineerId, date, hoursLogged, description, researchCategory });
  } catch (error) {
    console.error('Error logging timesheet hours:', error);
    res.status(500).json({ error: 'Failed to log timesheet hours' });
  }
});

// Approve timesheet entry
router.put('/timesheets/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const query = `
      UPDATE research_timesheets
      SET status = 'approved'
      WHERE id = ?
    `;

    await AppDataSource.query(query, [id]);

    res.json({ message: 'Timesheet entry approved' });
  } catch (error) {
    console.error('Error approving timesheet entry:', error);
    res.status(500).json({ error: 'Failed to approve timesheet entry' });
  }
});

// Delete timesheet entry
router.delete('/timesheets/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Delete timesheet entry
    await AppDataSource.query(`DELETE FROM research_timesheets WHERE id = ?`, [id]);

    res.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    res.status(500).json({ error: 'Failed to delete timesheet entry' });
  }
});

export default router;
