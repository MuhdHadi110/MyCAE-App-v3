import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Project } from '../entities/Project';
import { Timesheet } from '../entities/Timesheet';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// All timesheet routes require authentication
router.use(authenticate);

/**
 * GET /api/timesheets
 * Get all timesheets with optional filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, date, limit = 100, offset = 0 } = req.query;
    const timesheetRepo = AppDataSource.getRepository(Timesheet);

    let query = timesheetRepo.createQueryBuilder('timesheet')
      .leftJoinAndSelect('timesheet.engineer', 'engineer')
      .leftJoinAndSelect('timesheet.project', 'project');

    if (projectId) {
      query = query.where('timesheet.project_id = :projectId', { projectId });
    }

    if (date) {
      query = query.andWhere('DATE(timesheet.date) = :date', { date });
    }

    const [timesheets, total] = await query
      .take(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .getManyAndCount();

    // Format the response to include engineer name and email
    const formattedTimesheets = timesheets.map(ts => ({
      id: ts.id,
      project_id: ts.project_id,
      engineer_id: ts.engineer_id,
      date: ts.date,
      hours: ts.hours,
      work_category: ts.work_category,
      description: ts.description,
      created_at: ts.created_at,
      updated_at: ts.updated_at,
      engineerName: ts.engineer?.name || 'Unknown',
      engineerEmail: ts.engineer?.email || 'Unknown',
      projectCode: ts.project?.project_code,
      projectTitle: ts.project?.title,
    }));

    res.json({
      data: formattedTimesheets,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

/**
 * GET /api/timesheets/:id
 * Get single timesheet
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const timesheet = await timesheetRepo.findOne({
      where: { id: req.params.id },
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    res.json(timesheet);
  } catch (error: any) {
    console.error('Error fetching timesheet:', error);
    res.status(500).json({ error: 'Failed to fetch timesheet' });
  }
});

/**
 * POST /api/timesheets
 * Create new timesheet
 */
router.post(
  '/',
  [
    body('projectId').notEmpty().withMessage('Project is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('hours').isFloat({ gt: 0 }).withMessage('Hours must be greater than 0'),
    body('workCategory').notEmpty().withMessage('Work category is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const timesheetRepo = AppDataSource.getRepository(Timesheet);
      const projectRepo = AppDataSource.getRepository(Project);

      const { projectId, date, hours, workCategory, description } = req.body;

      // Create and save the new timesheet
      const newTimesheet = timesheetRepo.create({
        project_id: projectId,
        engineer_id: req.user!.id,
        date,
        hours,
        work_category: workCategory,
        description,
      });
      await timesheetRepo.save(newTimesheet);

      // Find the associated project
      const project = await projectRepo.findOne({ where: { id: projectId } });
      if (project) {
        // Update the actual_hours of the project
        project.actual_hours = (project.actual_hours || 0) + hours;
        await projectRepo.save(project);
      }

      res.status(201).json(newTimesheet);
    } catch (error: any) {
      console.error('Error creating timesheet:', error);
      res.status(500).json({ error: 'Failed to create timesheet' });
    }
  }
);

/**
 * PUT /api/timesheets/:id
 * Update timesheet - Only the assigned Project Manager or Lead Engineer can update timesheets for their project
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const projectRepo = AppDataSource.getRepository(Project);

    // Get the timesheet
    const timesheet = await timesheetRepo.findOne({
      where: { id: req.params.id },
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    // Get the associated project
    const project = await projectRepo.findOne({
      where: { id: timesheet.project_id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Authorization check: Only Project Manager or Lead Engineer can update timesheets
    const userId = req.user?.id;
    const isProjectManager = project.manager_id === userId;
    const isLeadEngineer = project.lead_engineer_id === userId;

    console.log('=== TIMESHEET UPDATE AUTHORIZATION CHECK ===');
    console.log('User ID:', userId);
    console.log('Project Manager ID:', project.manager_id);
    console.log('Lead Engineer ID:', project.lead_engineer_id);
    console.log('Is Project Manager:', isProjectManager);
    console.log('Is Lead Engineer:', isLeadEngineer);

    if (!isProjectManager && !isLeadEngineer) {
      console.log('AUTHORIZATION FAILED - User not assigned to project');
      return res.status(403).json({
        error: 'You do not have permission to update timesheets for this project. Only the assigned Project Manager or Lead Engineer can update timesheets.'
      });
    }

    // Update the timesheet with allowed fields
    const { hours, workCategory, description, date } = req.body;

    if (hours !== undefined) {
      // If hours changed, update the project's actual_hours
      const hoursDifference = hours - timesheet.hours;
      project.actual_hours = (project.actual_hours || 0) + hoursDifference;
      await projectRepo.save(project);

      timesheet.hours = hours;
    }

    if (workCategory !== undefined) {
      timesheet.work_category = workCategory;
    }

    if (description !== undefined) {
      timesheet.description = description;
    }

    if (date !== undefined) {
      timesheet.date = date;
    }

    await timesheetRepo.save(timesheet);

    console.log('Timesheet updated successfully');
    res.json(timesheet);
  } catch (error: any) {
    console.error('Error updating timesheet:', error);
    res.status(500).json({ error: 'Failed to update timesheet' });
  }
});

/**
 * DELETE /api/timesheets/:id
 * Delete timesheet - Only the assigned Project Manager or Lead Engineer can delete timesheets for their project
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const timesheetRepo = AppDataSource.getRepository(Timesheet);
    const projectRepo = AppDataSource.getRepository(Project);

    // Get the timesheet
    const timesheet = await timesheetRepo.findOne({
      where: { id: req.params.id },
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    // Get the associated project
    const project = await projectRepo.findOne({
      where: { id: timesheet.project_id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Authorization check: Only Project Manager or Lead Engineer can delete timesheets
    const userId = req.user?.id;
    const isProjectManager = project.manager_id === userId;
    const isLeadEngineer = project.lead_engineer_id === userId;

    console.log('=== TIMESHEET DELETE AUTHORIZATION CHECK ===');
    console.log('User ID:', userId);
    console.log('Project Manager ID:', project.manager_id);
    console.log('Lead Engineer ID:', project.lead_engineer_id);
    console.log('Is Project Manager:', isProjectManager);
    console.log('Is Lead Engineer:', isLeadEngineer);

    if (!isProjectManager && !isLeadEngineer) {
      console.log('AUTHORIZATION FAILED - User not assigned to project');
      return res.status(403).json({
        error: 'You do not have permission to delete timesheets for this project. Only the assigned Project Manager or Lead Engineer can delete timesheets.'
      });
    }

    // Update the project's actual_hours
    if (timesheet.hours) {
      project.actual_hours = Math.max(0, (project.actual_hours || 0) - timesheet.hours);
      await projectRepo.save(project);
    }

    // Delete the timesheet
    await timesheetRepo.remove(timesheet);

    console.log('Timesheet deleted successfully');
    res.json({ message: 'Timesheet deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting timesheet:', error);
    res.status(500).json({ error: 'Failed to delete timesheet' });
  }
});

export default router;
