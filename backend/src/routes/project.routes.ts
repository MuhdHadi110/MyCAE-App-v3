import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Project, ProjectStatus, BillingType } from '../entities/Project';
import { TeamMember } from '../entities/TeamMember';
import { User } from '../entities/User';
import { Company } from '../entities/Company';
import { Contact } from '../entities/Contact';
import { PurchaseOrder } from '../entities/PurchaseOrder';
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
 * Authorization: All authenticated users can see all projects (for overview dashboard)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);

    const query = projectRepo.createQueryBuilder('project')
      .leftJoinAndSelect('project.lead_engineer', 'lead_engineer')
      .leftJoinAndSelect('project.manager', 'manager')
      .leftJoin('project.company', 'company')
      .addSelect(['company.id', 'company.name'])
      .leftJoin('project.contact', 'contact')
      .addSelect(['contact.id', 'contact.name', 'contact.email'])
      .leftJoin('project.parentProject', 'parentProject')
      .addSelect(['parentProject.id', 'parentProject.project_code', 'parentProject.title']);

    const projects = await query.getMany();

    // Format response to include company name
    const formattedProjects = projects.map(p => ({
      ...p,
      companyName: p.company?.name || null,
      engineerName: p.lead_engineer?.name || null,
      managerName: p.manager?.name || null,
    }));

    res.json(formattedProjects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/next-code
 * Get the latest project code and suggest next one
 * IMPORTANT: This route must come BEFORE /:id to avoid matching "/next-code" as an ID
 *
 * Project code format: J2XXXX where:
 * - J is the prefix
 * - 2X is the 2-digit year (e.g., 26 for 2026)
 * - XXX is the 3-digit sequence number (001-999)
 * Example: J26001, J26002, ..., J26999
 */
router.get('/next-code', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);

    // Get current year (e.g., 2026 -> "26")
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // "26" for 2026
    const yearPrefix = `J${yearSuffix}`; // "J26"

    // Find all projects with current year prefix (J26xxx)
    const yearProjects = await projectRepo
      .createQueryBuilder('project')
      .where('project.project_code LIKE :prefix', { prefix: `${yearPrefix}%` })
      .getMany();

    // Extract sequence numbers from project codes
    // Valid format: J + 2-digit year + 3-digit sequence = J2XXXX (6 chars total)
    const sequenceNumbers = yearProjects
      .map(p => {
        const code = p.project_code;
        // Match format J + 2 digits (year) + 3 digits (sequence) = /^J(\d{2})(\d{3})$/
        const match = code.match(/^J(\d{2})(\d{3})$/);
        if (!match) {
          console.log(`Skipping invalid project code format: ${code}`);
          return NaN;
        }
        // Only use codes from current year
        if (match[1] !== yearSuffix) {
          return NaN;
        }
        return parseInt(match[2], 10); // Return just the sequence number
      })
      .filter(n => !isNaN(n));

    const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    const nextSequence = maxSequence + 1;

    // Format sequence with leading zeros (e.g., 001, 002, ..., 999)
    const formatSequence = (seq: number) => seq.toString().padStart(3, '0');

    const latestCode = maxSequence > 0
      ? `${yearPrefix}${formatSequence(maxSequence)}`
      : null;

    const nextSuggestion = `${yearPrefix}${formatSequence(nextSequence)}`;

    res.json({
      latestCode,
      nextSuggestion,
      yearPrefix,
      year: currentYear,
    });
  } catch (error: any) {
    console.error('Error fetching next project code:', error);
    res.status(500).json({ error: 'Failed to fetch next project code' });
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
      relations: ['lead_engineer', 'manager', 'company', 'contact'],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Format response to include company name
    const formattedProject = {
      ...project,
      companyName: project.company?.name || null,
      engineerName: project.lead_engineer?.name || null,
      managerName: project.manager?.name || null,
    };

    res.json(formattedProject);
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
    UserRole.ENGINEER,
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('companyId').notEmpty().withMessage('Company is required'),
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

      // Check for duplicate project with same title and company
      const existingProject = await projectRepo.findOne({
        where: {
          title: req.body.title,
          company_id: req.body.companyId,
        },
      });

      if (existingProject) {
        return res.status(400).json({
          error: 'A project with this title already exists for this company',
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

      // Validate project code format (J + 5 digits or J + 5 digits + _number for VOs)
      // Regular projects: J25001
      // Variation Orders: J25001_1, J25001_2, etc.
      const projectCodeRegex = /^J\d{5}(_\d+)?$/;
      if (!req.body.projectCode || !projectCodeRegex.test(req.body.projectCode)) {
        return res.status(400).json({
          error: 'Project Code must be in format J2XXXX or J2XXXX_N (e.g., J25001 or J25001_1)',
        });
      }

      const projectCode = req.body.projectCode;

      // Handle VO fields if this is a variation order
      let parentProjectId = null;
      let isVariationOrder = false;
      let voNumber = null;

      // If it's a VO code (contains underscore), validate parent exists
      const isVO = projectCode.includes('_');
      if (isVO) {
        const [parentCode, voNumberStr] = projectCode.split('_');
        const parentProject = await projectRepo.findOne({
          where: { project_code: parentCode },
        });

        if (!parentProject) {
          return res.status(400).json({
            error: `Parent project ${parentCode} not found. Create the parent project first.`,
          });
        }

        // Validate parent is not itself a VO
        if (parentProject.is_variation_order) {
          return res.status(400).json({
            error: 'Cannot create a Variation Order under another Variation Order.',
          });
        }

        // Set VO fields
        parentProjectId = parentProject.id;
        isVariationOrder = true;
        voNumber = parseInt(voNumberStr, 10);
      }

      // Check for duplicate project code
      const existingProjectCode = await projectRepo.findOne({
        where: {
          project_code: req.body.projectCode,
        },
      });

      if (existingProjectCode) {
        return res.status(400).json({
          error: 'Project code already exists. Please use a different code.',
          field: 'projectCode',
          existingCode: existingProjectCode.project_code,
          existingProjectTitle: existingProjectCode.title,
        });
      }

      // Map camelCase fields from frontend to snake_case for database
      // Use resolved user_ids instead of team_member ids
      // Auto set start_date to current date, completion_date set when project is completed
      const project = projectRepo.create({
        project_code: projectCode,
        title: req.body.title,
        company_id: req.body.companyId,
        contact_id: req.body.contactId || null,
        status: ProjectStatus.PRE_LIM, // Always start with pre-lim status
        billing_type: req.body.billingType === 'lump_sum' ? BillingType.LUMP_SUM : BillingType.HOURLY,
        planned_hours: req.body.plannedHours || 0,
        hourly_rate: req.body.hourlyRate || null, // Hourly rate for the project
        actual_hours: 0,
        lead_engineer_id: leadEngineerUserId || null,
        manager_id: managerUserId,
        start_date: new Date(), // Auto set to current date
        inquiry_date: new Date(), // Set inquiry date when created
        description: req.body.description || null,
        categories: req.body.workTypes || null,
        // VO fields
        parent_project_id: parentProjectId,
        is_variation_order: isVariationOrder,
        vo_number: voNumber,
        // completion_date will be set automatically when status changes to 'completed'
      } as Partial<Project>);
      await projectRepo.save(project);

      // Fetch related data for notifications
      const userRepo = AppDataSource.getRepository(User);
      const companyRepo = AppDataSource.getRepository(Company);
      const contactRepo = AppDataSource.getRepository(Contact);

      const company = await companyRepo.findOne({ where: { id: req.body.companyId } });

      const contact = await contactRepo.findOne({
        where: { id: req.body.contactId },
        relations: ['company']
      });

      const manager = await userRepo.findOne({ where: { id: managerUserId } });

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
              company?.name || 'Unknown Company',
              contact?.name || 'N/A',
              contact?.email || 'N/A',
              manager?.name || 'N/A'
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
              clientName: company?.name,
            }).catch(err => {
              console.error('Failed to trigger n8n webhook:', err.message);
            })
          );
        }
      }

      // Notify manager if assigned
      if (managerUserId) {
        if (manager && manager.email && manager.id !== leadEngineerUserId) {
          // Only notify if manager is different from lead engineer
          notificationPromises.push(
            emailService.sendProjectAssignmentNotification(
              manager.email,
              manager.name,
              project.title,
              project.project_code,
              'Project Manager',
              company?.name || 'Unknown Company',
              contact?.name || 'N/A',
              contact?.email || 'N/A',
              manager?.name || 'N/A'
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
              clientName: company?.name,
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

      // Handle database duplicate constraint errors
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_DUP_KEY') {
        // Extract project code from error message
        const match = error.message?.match(/'(\w+)'/);
        const duplicateCode = match ? match[1] : '';

        return res.status(400).json({
          error: `Project code "${duplicateCode}" already exists. Please use a different code.`,
          field: 'projectCode',
          duplicateCode,
        });
      }

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
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const purchaseOrderRepo = AppDataSource.getRepository(PurchaseOrder);
      const project = await projectRepo.findOne({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if project has any POs (for billing type change validation)
      const existingPOs = await purchaseOrderRepo.find({
        where: { project_code: project.project_code }
      });
      const hasPOs = existingPOs.length > 0;

      // Resolve team_member IDs to user_ids for manager and lead engineer (if provided)
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

      // Map camelCase fields from frontend to snake_case for database
      const updates: any = {};

      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.plannedHours !== undefined) updates.planned_hours = req.body.plannedHours;
      if (req.body.hourlyRate !== undefined) updates.hourly_rate = req.body.hourlyRate;
      if (req.body.categories !== undefined) updates.categories = req.body.categories;
      if (req.body.description !== undefined) updates.description = req.body.description;
      // Status is now auto-managed by PO/Invoice operations - cannot be manually updated
      // if (req.body.status !== undefined) updates.status = req.body.status;
      if (leadEngineerUserId !== undefined) updates.lead_engineer_id = leadEngineerUserId;
      if (managerUserId !== undefined) updates.manager_id = managerUserId;
      if (req.body.companyId !== undefined) updates.company_id = req.body.companyId;
      if (req.body.contactId !== undefined) updates.contact_id = req.body.contactId;
      if (req.body.inquiryDate !== undefined) updates.inquiry_date = req.body.inquiryDate;
      if (req.body.poReceivedDate !== undefined) updates.po_received_date = req.body.poReceivedDate;
      if (req.body.completionDate !== undefined) updates.completion_date = req.body.completionDate;

      // Handle billing type change (only allowed if no POs exist)
      if (req.body.billingType !== undefined) {
        if (hasPOs) {
          return res.status(400).json({
            error: 'Cannot change billing type after PO has been created'
          });
        }
        updates.billing_type = req.body.billingType === 'lump_sum' ? BillingType.LUMP_SUM : BillingType.HOURLY;
      }

      // Status is auto-managed by PO/Invoice operations - status-related date updates removed

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

      // Check for variation orders if this is a parent project
      if (!project.is_variation_order) {
        const vos = await projectRepo.find({
          where: { parent_project_id: project.id },
        });

        if (vos.length > 0) {
          return res.status(400).json({
            error: 'Cannot delete project with variation orders',
            variationOrders: vos.map(vo => ({
              id: vo.id,
              projectCode: vo.project_code,
              title: vo.title,
            })),
            message: 'Please delete all variation orders first, or use force delete.',
          });
        }
      }

      // Use transaction to ensure atomic deletion
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Delete PO file if exists (outside transaction since it's filesystem)
        if (project.po_file_url) {
          deleteFile(project.po_file_url);
        }

        // Delete related timesheets first to avoid foreign key constraint
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('timesheets')
          .where('project_id = :projectId', { projectId: req.params.id })
          .execute();

        // Delete project team members
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('project_team_members')
          .where('project_id = :projectId', { projectId: req.params.id })
          .execute();

        // Finally delete the project
        await transactionalEntityManager.remove(project);
      });

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
 * Authorization: Senior Engineer and above only
 */
router.post(
  '/:id/upload-po',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  upload.single('poFile'),
  async (req: AuthRequest, res: Response) => {
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
 * Authorization: Senior Engineer and above only
 */
router.delete(
  '/:id/po-file',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  async (req: AuthRequest, res: Response) => {
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

    // Check if any POs remain for this project in the purchase_orders table
    const poRepo = AppDataSource.getRepository(PurchaseOrder);
    const remainingPOs = await poRepo.count({
      where: { project_code: project.project_code }
    });

    // If no POs remain, revert project status from 'ongoing' to 'pre-lim'
    if (remainingPOs === 0 && project.status === ProjectStatus.ONGOING) {
      console.log(`📋 Reverting project ${project.project_code} status from ongoing to pre-lim (PO file deleted, no POs remain)`);
      project.status = ProjectStatus.PRE_LIM;
      project.po_received_date = undefined;
      await projectRepo.save(project);
      console.log(`✅ Project ${project.project_code} status reverted to pre-lim`);
    }

    res.json({
      message: 'PO file deleted successfully',
      deleted,
      statusReverted: remainingPOs === 0 && project.status === ProjectStatus.PRE_LIM,
    });
  } catch (error: any) {
    console.error('Error deleting PO file:', error);
    res.status(500).json({ error: 'Failed to delete PO file' });
  }
});

/**
 * PATCH /api/projects/:id/status
 * Update project status with related dates
 * DEPRECATED: Status is now auto-managed by PO/Invoice operations
 * This endpoint is kept for backwards compatibility but does nothing
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

      // Status is auto-managed - return current status without modification
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { id: req.params.id } });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        message: 'Project status is auto-managed and cannot be manually updated. Status changes automatically based on PO and Invoice status.',
        project,
      });
    } catch (error: any) {
      console.error('Error updating project status:', error);
      res.status(500).json({ error: 'Failed to update project status' });
    }
  }
);

/**
 * GET /api/projects/:id/variation-orders
 * Get all variation orders for a parent project
 */
router.get('/:id/variation-orders', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);

    // Find the parent project
    const parentProject = await projectRepo.findOne({
      where: { id: req.params.id },
    });

    if (!parentProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if this is itself a VO
    if (parentProject.is_variation_order) {
      return res.status(400).json({
        error: 'This is a Variation Order. Use the parent project ID to get all VOs.',
      });
    }

    // Get all VOs for this parent
    const vos = await projectRepo.find({
      where: { parent_project_id: parentProject.id },
      relations: ['lead_engineer', 'manager', 'company', 'contact'],
      order: { vo_number: 'ASC' },
    });

    res.json(vos);
  } catch (error: any) {
    console.error('Error fetching variation orders:', error);
    res.status(500).json({ error: 'Failed to fetch variation orders' });
  }
});

/**
 * GET /api/projects/:id/with-vos
 * Get project with all its variation orders and aggregated financials
 */
router.get('/:id/with-vos', async (req: AuthRequest, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);

    // Find the project
    const project = await projectRepo.findOne({
      where: { id: req.params.id },
      relations: ['lead_engineer', 'manager', 'company', 'contact', 'variationOrders'],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If this is a VO, redirect to parent
    if (project.is_variation_order && project.parent_project_id) {
      const parentProject = await projectRepo.findOne({
        where: { id: project.parent_project_id },
        relations: ['lead_engineer', 'manager', 'company', 'contact', 'variationOrders'],
      });
      return res.json(parentProject);
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project with VOs:', error);
    res.status(500).json({ error: 'Failed to fetch project with VOs' });
  }
});

/**
 * POST /api/projects/:id/create-vo
 * Create a new variation order for a parent project
 * Auto-generates the next VO number
 */
router.post(
  '/:id/create-vo',
  authorize(
    UserRole.SENIOR_ENGINEER,
    UserRole.PRINCIPAL_ENGINEER,
    UserRole.MANAGER,
    UserRole.MANAGING_DIRECTOR,
    UserRole.ADMIN
  ),
  [
    body('title').notEmpty().withMessage('Title is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const projectRepo = AppDataSource.getRepository(Project);

      // Find parent project
      const parentProject = await projectRepo.findOne({
        where: { id: req.params.id },
      });

      if (!parentProject) {
        return res.status(404).json({ error: 'Parent project not found' });
      }

      // Validate parent is not itself a VO
      if (parentProject.is_variation_order) {
        return res.status(400).json({
          error: 'Cannot create a VO under another VO',
        });
      }

      // Find existing VOs and determine next VO number
      const existingVOs = await projectRepo.find({
        where: { parent_project_id: parentProject.id },
        order: { vo_number: 'DESC' },
      });

      const nextVONumber = existingVOs.length > 0
        ? (existingVOs[0].vo_number || 0) + 1
        : 1;

      const voCode = `${parentProject.project_code}_${nextVONumber}`;

      // Check for duplicate VO code (shouldn't happen but safety check)
      const existingVO = await projectRepo.findOne({
        where: { project_code: voCode },
      });

      if (existingVO) {
        return res.status(400).json({
          error: `VO code ${voCode} already exists`,
        });
      }

      // Resolve team member IDs
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      let managerUserId = req.body.managerId || parentProject.manager_id;
      let leadEngineerUserId = req.body.leadEngineerId || parentProject.lead_engineer_id;

      if (req.body.managerId) {
        const manager = await teamMemberRepo.findOne({
          where: { id: req.body.managerId },
          relations: ['user']
        });
        if (manager && manager.user_id) {
          managerUserId = manager.user_id;
        }
      }

      if (req.body.leadEngineerId) {
        const leadEngineer = await teamMemberRepo.findOne({
          where: { id: req.body.leadEngineerId },
          relations: ['user']
        });
        if (leadEngineer && leadEngineer.user_id) {
          leadEngineerUserId = leadEngineer.user_id;
        }
      }

      // Create VO (inherit fields from parent by default)
      const vo = projectRepo.create({
        project_code: voCode,
        title: req.body.title,
        company_id: req.body.companyId || parentProject.company_id,
        contact_id: req.body.contactId || parentProject.contact_id,
        status: req.body.status || ProjectStatus.PRE_LIM,
        planned_hours: req.body.plannedHours || 0,
        actual_hours: 0,
        lead_engineer_id: leadEngineerUserId,
        manager_id: managerUserId,
        start_date: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        inquiry_date: new Date(),
        description: req.body.description || null,
        categories: req.body.workTypes || parentProject.categories,
        // VO-specific fields
        parent_project_id: parentProject.id,
        is_variation_order: true,
        vo_number: nextVONumber,
      });

      await projectRepo.save(vo);

      res.status(201).json({
        message: 'Variation Order created successfully',
        vo,
        voCode,
        voNumber: nextVONumber,
      });
    } catch (error: any) {
      console.error('Error creating variation order:', error);
      res.status(500).json({ error: 'Failed to create variation order' });
    }
  }
);

export default router;
