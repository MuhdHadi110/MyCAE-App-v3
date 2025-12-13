import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Protect all research routes with authentication
router.use(authenticate);

// Get all research projects
router.get('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const query = `SELECT * FROM research_projects ORDER BY created_at DESC`;
    const projects = await AppDataSource.query(query);
    res.json(projects || []);
  } catch (error) {
    console.error('Error fetching research projects:', error);
    res.status(500).json({ error: 'Failed to fetch research projects' });
  }
});

// Get research projects by status
router.get('/projects/status/:status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.params;
    const query = `SELECT * FROM research_projects WHERE status = ? ORDER BY created_at DESC`;
    const projects = await AppDataSource.query(query, [status]);
    res.json(projects || []);
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

// Create new research project
router.post('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const { researchCode, title, description, status, startDate, endDate, leadResearcherId, budget } = req.body;
    const id = uuidv4();

    const query = `
      INSERT INTO research_projects
      (id, research_code, title, description, status, start_date, planned_end_date, lead_researcher_id, budget)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await AppDataSource.query(query, [
      id,
      researchCode || null,
      title,
      description || null,
      status || 'planning',
      startDate,
      endDate || null,
      leadResearcherId,
      budget || null,
    ]);

    res.status(201).json({ id, researchCode, title, description, status, startDate, endDate, leadResearcherId, budget });
  } catch (error) {
    console.error('Error creating research project:', error);
    res.status(500).json({ error: 'Failed to create research project' });
  }
});

// Update research project
router.put('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, endDate, budget } = req.body;

    const query = `
      UPDATE research_projects
      SET title = ?, description = ?, status = ?, planned_end_date = ?, budget = ?
      WHERE id = ?
    `;

    await AppDataSource.query(query, [title, description || null, status, endDate || null, budget || null, id]);

    res.json({ id, title, description, status, endDate, budget });
  } catch (error) {
    console.error('Error updating research project:', error);
    res.status(500).json({ error: 'Failed to update research project' });
  }
});

// Delete research project
router.delete('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Delete timesheets first
    await AppDataSource.query(`DELETE FROM research_timesheets WHERE projectId = ?`, [id]);

    // Then delete project
    await AppDataSource.query(`DELETE FROM research_projects WHERE id = ?`, [id]);

    res.json({ message: 'Research project deleted successfully' });
  } catch (error) {
    console.error('Error deleting research project:', error);
    res.status(500).json({ error: 'Failed to delete research project' });
  }
});

// Log timesheet hours
router.post('/timesheets', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamMemberId, teamMemberName, date, hoursLogged, description, researchCategory } = req.body;
    const id = uuidv4();

    const query = `
      INSERT INTO research_timesheets
      (id, project_id, team_member_id, date, hours_logged, description, category, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    await AppDataSource.query(query, [
      id,
      projectId,
      teamMemberId,
      date,
      hoursLogged,
      description,
      researchCategory || null,
    ]);

    res.status(201).json({ id, projectId, teamMemberId, teamMemberName, date, hoursLogged, description, researchCategory });
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
