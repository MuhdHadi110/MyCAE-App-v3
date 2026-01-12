import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/Company';
import { Contact } from '../entities/Contact';
import { authenticate } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/companies
 * Get all companies with their contacts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyRepo = AppDataSource.getRepository(Company);

    const companies = await companyRepo.find({
      relations: ['contacts'],
      where: { deleted_at: null as any },
      order: { name: 'ASC' },
    });

    res.json(companies);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/companies/:id
 * Get a specific company with its contacts
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyRepo = AppDataSource.getRepository(Company);

    const company = await companyRepo.findOne({
      where: { id, deleted_at: null as any },
      relations: ['contacts'],
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error: any) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * POST /api/companies
 * Create a new company
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('industry').optional().isString(),
    body('website').optional().isString(),
    body('address').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, industry, website, address } = req.body;
      const companyRepo = AppDataSource.getRepository(Company);

      // Check if company with same name already exists
      const existingCompany = await companyRepo.findOne({
        where: { name, deleted_at: null as any },
      });

      if (existingCompany) {
        return res.status(400).json({ error: 'Company with this name already exists' });
      }

      // Create new company
      const company = companyRepo.create({
        name,
        industry,
        website,
        address,
      });

      await companyRepo.save(company);

      res.status(201).json({
        message: 'Company created successfully',
        company,
      });
    } catch (error: any) {
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  }
);

/**
 * PUT /api/companies/:id
 * Update a company
 */
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('industry').optional().isString(),
    body('website').optional().isString(),
    body('address').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, industry, website, address } = req.body;
      const companyRepo = AppDataSource.getRepository(Company);

      const company = await companyRepo.findOne({
        where: { id, deleted_at: null as any },
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // If name is being changed, check for duplicates
      if (name && name !== company.name) {
        const existingCompany = await companyRepo.findOne({
          where: { name, deleted_at: null as any },
        });

        if (existingCompany) {
          return res.status(400).json({ error: 'Company with this name already exists' });
        }
      }

      // Update company
      if (name) company.name = name;
      if (industry !== undefined) company.industry = industry;
      if (website !== undefined) company.website = website;
      if (address !== undefined) company.address = address;

      await companyRepo.save(company);

      res.json({
        message: 'Company updated successfully',
        company,
      });
    } catch (error: any) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  }
);

/**
 * DELETE /api/companies/:id
 * Soft delete a company
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyRepo = AppDataSource.getRepository(Company);

    const company = await companyRepo.findOne({
      where: { id, deleted_at: null as any },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Soft delete the company
    company.deleted_at = new Date();
    await companyRepo.save(company);

    res.json({
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

/**
 * GET /api/companies/:id/contacts
 * Get all contacts for a specific company
 */
router.get('/:id/contacts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyRepo = AppDataSource.getRepository(Company);
    const contactRepo = AppDataSource.getRepository(Contact);

    // Check if company exists
    const company = await companyRepo.findOne({
      where: { id, deleted_at: null as any },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get contacts for this company
    const contacts = await contactRepo.find({
      where: { company_id: id, deleted_at: null as any },
      order: { name: 'ASC' },
    });

    res.json(contacts);
  } catch (error: any) {
    console.error('Error fetching company contacts:', error);
    res.status(500).json({ error: 'Failed to fetch company contacts' });
  }
});

export default router;
