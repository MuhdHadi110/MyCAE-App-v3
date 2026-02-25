"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Company_1 = require("../entities/Company");
const Contact_1 = require("../entities/Contact");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
/**
 * GET /api/companies
 * Get all companies with their contacts
 */
router.get('/', async (req, res) => {
    try {
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const companies = await companyRepo.find({
            relations: ['contacts'],
            where: { deleted_at: null },
            order: { name: 'ASC' },
        });
        res.json(companies);
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});
/**
 * GET /api/companies/:id
 * Get a specific company with its contacts
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const company = await companyRepo.findOne({
            where: { id, deleted_at: null },
            relations: ['contacts'],
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});
/**
 * POST /api/companies
 * Create a new company
 */
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Company name is required'),
    (0, express_validator_1.body)('industry').optional().isString(),
    (0, express_validator_1.body)('website').optional().isString(),
    (0, express_validator_1.body)('address').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, industry, website, address } = req.body;
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        // Check if company with same name already exists
        const existingCompany = await companyRepo.findOne({
            where: { name, deleted_at: null },
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
    }
    catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});
/**
 * PUT /api/companies/:id
 * Update a company
 */
router.put('/:id', [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Company name cannot be empty'),
    (0, express_validator_1.body)('industry').optional().isString(),
    (0, express_validator_1.body)('website').optional().isString(),
    (0, express_validator_1.body)('address').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { name, industry, website, address } = req.body;
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const company = await companyRepo.findOne({
            where: { id, deleted_at: null },
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // If name is being changed, check for duplicates
        if (name && name !== company.name) {
            const existingCompany = await companyRepo.findOne({
                where: { name, deleted_at: null },
            });
            if (existingCompany) {
                return res.status(400).json({ error: 'Company with this name already exists' });
            }
        }
        // Update company
        if (name)
            company.name = name;
        if (industry !== undefined)
            company.industry = industry;
        if (website !== undefined)
            company.website = website;
        if (address !== undefined)
            company.address = address;
        await companyRepo.save(company);
        res.json({
            message: 'Company updated successfully',
            company,
        });
    }
    catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});
/**
 * DELETE /api/companies/:id
 * Soft delete a company
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const company = await companyRepo.findOne({
            where: { id, deleted_at: null },
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
    }
    catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});
/**
 * GET /api/companies/:id/contacts
 * Get all contacts for a specific company
 */
router.get('/:id/contacts', async (req, res) => {
    try {
        const { id } = req.params;
        const companyRepo = database_1.AppDataSource.getRepository(Company_1.Company);
        const contactRepo = database_1.AppDataSource.getRepository(Contact_1.Contact);
        // Check if company exists
        const company = await companyRepo.findOne({
            where: { id, deleted_at: null },
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // Get contacts for this company
        const contacts = await contactRepo.find({
            where: { company_id: id, deleted_at: null },
            order: { name: 'ASC' },
        });
        res.json(contacts);
    }
    catch (error) {
        console.error('Error fetching company contacts:', error);
        res.status(500).json({ error: 'Failed to fetch company contacts' });
    }
});
exports.default = router;
//# sourceMappingURL=company.routes.js.map