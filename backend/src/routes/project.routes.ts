import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Project, ProjectStatus } from '../entities/Project';
import { TeamMember } from '../entities/TeamMember';
import { User } from '../entities/User';
import { Client } from '../entities/Client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';
import { upload, deleteFile, generateFileUrl } from '../utils/fileUpload';
import emailService from '../services/email.service';
import n8nService from '../services/n8n.service';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const projects = await projectRepo.find({
      relations: ['lead_engineer', 'manager'],
    });
    res.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get single project
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({
      where: { id: req.params.id },
      relations: ['lead_engineer', 'manager'],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post(
  '/',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('clientId').notEmpty().withMessage('Client is required'),
    body('managerId').notEmpty().withMessage('Project Manager is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const projectRepo = AppDataSource.getRepository(Project);
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);

      // Check for duplicate project with same title and client
      const existingProject = await projectRepo.findOne({
        where: {
          title: req.body.title,
          client_id: req.body.clientId,
        },
      });

      if (existingProject) {
        return res.status(400).json({
          error: 'A project with this title already exists for this client',
        });
      }

      // Resolve team_member IDs to user_ids for manager and lead engineer
      let managerUserId = req.body.managerId;
      let leadEngineerUserId = req.body.leadEngineerId;

      // If managerId is a team_member ID, get the user_id
      if (managerUserId) {
        const manager = await teamMemberRepo.findOne({
          where: { id: managerUserId },
          relations: ['user']
        });
        if (manager && manager.user_id) {
          managerUserId = manager.user_id;
        }
      }

      // If leadEngineerId is a team_member ID, get the user_id
      if (leadEngineerUserId) {
        const leadEngineer = await teamMemberRepo.findOne({
          where: { id: leadEngineerUserId },
          relations: ['user']
        });
        if (leadEngineer && leadEngineer.user_id) {
          leadEngineerUserId = leadEngineer.user_id;
        }
      }

      // Validate project code format (J + 5 digits, e.g., J25001)
      const projectCodeRegex = /^J\d{5}$/;
      if (!req.body.projectCode || !projectCodeRegex.test(req.body.projectCode)) {
        return res.status(400).json({
          error: 'Project Code must be in format J2XXXX (e.g., J25001)',
        });
      }

      const projectCode = req.body.projectCode;

      // Map camelCase fields from frontend to snake_case for database
      // Use resolved user_ids instead of team_member ids
      // Auto set start_date to current date, completion_date set when project is completed
      const project = projectRepo.create({
        project_code: projectCode,
        title: req.body.title,
        client_id: req.body.clientId,
        status: ProjectStatus.PRE_LIM, // Always start with pre-lim status
        planned_hours: req.body.plannedHours || 0,
        actual_hours: 0,
        lead_engineer_id: leadEngineerUserId || null,
        manager_id: managerUserId,
        start_date: new Date(), // Auto set to current date
        inquiry_date: new Date(), // Set inquiry date when created
        remarks: req.body.description || null,
        categories: req.body.workTypes || null,
        // completion_date will be set automatically when status changes to 'completed'
      });
      await projectRepo.save(project);

      // Fetch related data for notifications
      const userRepo = AppDataSource.getRepository(User);
      const clientRepo = AppDataSource.getRepository(Client);

      const client = await clientRepo.findOne({ where: { id: req.body.clientId } });

      // Send notifications to assigned users
      const notificationPromises = [];

      // Notify lead engineer if assigned
      if (leadEngineerUserId) {
        const leadEngineer = await userRepo.findOne({ where: { id: leadEngineerUserId } });
        if (leadEngineer && leadEngineer.email) {
          notificationPromises.push(
            emailService.sendProjectAssignmentNotification(
              leadEngineer.email,
              leadEngineer.name,
              project.title,
              project.project_code,
              'Lead Engineer',
              client?.name || 'Unknown Client'
            ).catch(err => {
              console.error('Failed to send email to lead engineer:', err.message);
              // Don't throw - let the project creation succeed even if email fails
            })
          );

          // Trigger n8n webhook
          notificationPromises.push(
            n8nService.onProjectAssigned({
              projectId: project.id,
              projectCode: project.project_code,
              projectTitle: project.title,
              assignedUserId: leadEngineerUserId,
              assignedUserName: leadEngineer.name,
              assignedUserEmail: leadEngineer.email,
              role: 'Lead Engineer',
              clientName: client?.name,
            }).catch(err => {
              console.error('Failed to trigger n8n webhook:', err.message);
            })
          );
        }
      }

      // Notify manager if assigned
      if (managerUserId) {
        const manager = await userRepo.findOne({ where: { id: managerUserId } });
        if (manager && manager.email && manager.id !== leadEngineerUserId) {
          // Only notify if manager is different from lead engineer
          notificationPromises.push(
            emailService.sendProjectAssignmentNotification(
              manager.email,
              manager.name,
              project.title,
              project.project_code,
              'Project Manager',
              client?.name || 'Unknown Client'
            ).catch(err => {
              console.error('Failed to send email to manager:', err.message);
            })
          );

          notificationPromises.push(
            n8nService.onProjectAssigned({
              projectId: project.id,
              projectCode: project.project_code,
              projectTitle: project.title,
              assignedUserId: managerUserId,
              assignedUserName: manager.name,
              assignedUserEmail: manager.email,
              role: 'Project Manager',
              clientName: client?.name,
            }).catch(err => {
              console.error('Failed to trigger n8n webhook:', err.message);
            })
          );
        }
      }

      // Wait for all notifications to complete (but don't block response)
      Promise.all(notificationPromises).catch(err => {
        console.error('Error sending notifications:', err);
      });

      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put(
  '/:id',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  async (req: AuthRequest, res) => {
    try {
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Whitelist allowed fields to prevent mass assignment
      const allowedFields = [
        'title',
        'planned_hours',
        'remarks',
        'categories',
        'description',
        'status',
        'lead_engineer_id',
        'manager_id',
        'inquiry_date',
        'po_received_date',
        'completion_date',
      ];

      const updates: any = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updates[field] = req.body[field];
        }
      }

      // Handle status-related date auto-updates
      if (updates.status) {
        const now = new Date();
        switch (updates.status) {
          case 'pre-lim':
            if (!project.inquiry_date && !updates.inquiry_date) {
              updates.inquiry_date = now;
            }
            break;
          case 'ongoing':
            if (!project.po_received_date && !updates.po_received_date) {
              updates.po_received_date = now;
            }
            break;
          case 'completed':
            if (!project.completion_date && !updates.completion_date) {
              updates.completion_date = now;
            }
            break;
        }
      }

      projectRepo.merge(project, updates);
      await projectRepo.save(project);

      res.json(project);
    } catch (error: any) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete(
  '/:id',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  async (req: AuthRequest, res) => {
    try {
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Delete PO file if exists
      if (project.po_file_url) {
        deleteFile(project.po_file_url);
      }

      await projectRepo.remove(project);

      res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

/**
 * POST /api/projects/:id/upload-po
 * Upload PO file for project
 */
router.post('/:id/upload-po', upload.single('poFile'), async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: req.params.id } });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old PO file if exists
    if (project.po_file_url) {
      deleteFile(project.po_file_url);
    }

    // Generate file URL
    const fileUrl = generateFileUrl(req.file.filename, req);

    // Update project with new PO file URL
    project.po_file_url = fileUrl;
    await projectRepo.save(project);

    res.json({
      message: 'PO file uploaded successfully',
      fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    console.error('Error uploading PO file:', error);
    res.status(500).json({ error: 'Failed to upload PO file' });
  }
});

/**
 * DELETE /api/projects/:id/po-file
 * Delete PO file
 */
router.delete('/:id/po-file', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: req.params.id } });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.po_file_url) {
      return res.status(404).json({ error: 'No PO file found' });
    }

    // Delete file from filesystem
    const deleted = deleteFile(project.po_file_url);

    // Remove URL from database
    project.po_file_url = undefined;
    await projectRepo.save(project);

    res.json({
      message: 'PO file deleted successfully',
      deleted,
    });
  } catch (error: any) {
    console.error('Error deleting PO file:', error);
    res.status(500).json({ error: 'Failed to delete PO file' });
  }
});

/**
 * PATCH /api/projects/:id/status
 * Update project status with related dates
 */
router.patch(
  '/:id/status',
  [
    body('status').isIn(['pre-lim', 'ongoing', 'completed']).withMessage('Invalid status'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { status } = req.body;
      const now = new Date();

      // Update status
      project.status = status as ProjectStatus;

      // Set appropriate date based on status
      switch (status) {
        case 'pre-lim':
          if (!project.inquiry_date) {
            project.inquiry_date = now;
          }
          break;
        case 'ongoing':
          if (!project.po_received_date) {
            project.po_received_date = now;
          }
          break;
        case 'completed':
          if (!project.completion_date) {
            project.completion_date = now;
          }
          break;
      }

      await projectRepo.save(project);

      res.json({
        message: 'Project status updated successfully',
        project,
      });
    } catch (error: any) {
      console.error('Error updating project status:', error);
      res.status(500).json({ error: 'Failed to update project status' });
    }
  }
);

export default router;
