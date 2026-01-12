import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Contact } from '../entities/Contact';
import { Company } from '../entities/Company';
import { authenticate } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/contacts
 * Get all contacts with optional company filter
 * Query params: company_id (optional)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    const contactRepo = AppDataSource.getRepository(Contact);

    const where: any = { deleted_at: null as any };
    if (company_id) {
      where.company_id = company_id;
    }

    const contacts = await contactRepo.find({
      where,
      relations: ['company'],
      order: { company: { name: 'ASC' }, name: 'ASC' },
    });

    res.json(contacts);
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * GET /api/contacts/:id
 * Get a specific contact
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contactRepo = AppDataSource.getRepository(Contact);

    const contact = await contactRepo.findOne({
      where: { id, deleted_at: null as any },
      relations: ['company'],
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post(
  '/',
  [
    body('company_id').notEmpty().withMessage('Company ID is required'),
    body('name').notEmpty().withMessage('Contact name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString(),
    body('position').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { company_id, name, email, phone, position } = req.body;
      const companyRepo = AppDataSource.getRepository(Company);
      const contactRepo = AppDataSource.getRepository(Contact);

      // Check if company exists
      const company = await companyRepo.findOne({
        where: { id: company_id, deleted_at: null as any },
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check if contact with same email already exists for this company
      const existingContact = await contactRepo.findOne({
        where: { company_id, email, deleted_at: null as any },
      });

      if (existingContact) {
        return res.status(400).json({ error: 'Contact with this email already exists for this company' });
      }

      // Create new contact
      const contact = contactRepo.create({
        company_id,
        name,
        email,
        phone,
        position,
      });

      await contactRepo.save(contact);

      // Fetch the contact with company relation
      const savedContact = await contactRepo.findOne({
        where: { id: contact.id },
        relations: ['company'],
      });

      res.status(201).json({
        message: 'Contact created successfully',
        contact: savedContact,
      });
    } catch (error: any) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }
);

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Contact name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString(),
    body('position').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, email, phone, position } = req.body;
      const contactRepo = AppDataSource.getRepository(Contact);

      const contact = await contactRepo.findOne({
        where: { id, deleted_at: null as any },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // If email is being changed, check for duplicates within the same company
      if (email && email !== contact.email) {
        const existingContact = await contactRepo.findOne({
          where: { company_id: contact.company_id, email, deleted_at: null as any },
        });

        if (existingContact) {
          return res.status(400).json({ error: 'Contact with this email already exists for this company' });
        }
      }

      // Update contact
      if (name) contact.name = name;
      if (email) contact.email = email;
      if (phone !== undefined) contact.phone = phone;
      if (position !== undefined) contact.position = position;

      await contactRepo.save(contact);

      // Fetch the updated contact with company relation
      const updatedContact = await contactRepo.findOne({
        where: { id },
        relations: ['company'],
      });

      res.json({
        message: 'Contact updated successfully',
        contact: updatedContact,
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }
);

/**
 * DELETE /api/contacts/:id
 * Soft delete a contact
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contactRepo = AppDataSource.getRepository(Contact);

    const contact = await contactRepo.findOne({
      where: { id, deleted_at: null as any },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // TODO: Check if contact is used in any projects before allowing deletion
    // For now, we'll allow deletion but the foreign key constraint will prevent
    // deletion if the contact is referenced in projects (ON DELETE RESTRICT)

    // Soft delete the contact
    contact.deleted_at = new Date();
    await contactRepo.save(contact);

    res.json({
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);

    // Check if error is due to foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        error: 'Cannot delete contact that is associated with existing projects'
      });
    }

    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
