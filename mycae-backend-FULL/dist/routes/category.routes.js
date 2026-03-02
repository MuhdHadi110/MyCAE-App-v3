"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All category routes require authentication
router.use(auth_1.authenticate);
// Default categories
const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Equipment', description: 'General equipment' },
    { id: '2', name: 'Office Supplies', description: 'Office supplies and furniture' },
    { id: '3', name: 'Electronics', description: 'Electronic devices' },
    { id: '4', name: 'Tools', description: 'Tools and hardware' },
    { id: '5', name: 'Safety', description: 'Safety equipment' },
];
// In-memory store for custom categories (will be replaced with database later)
let customCategories = [...DEFAULT_CATEGORIES];
/**
 * GET /api/categories
 * Get all categories
 */
router.get('/', async (req, res) => {
    try {
        res.json(customCategories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
/**
 * GET /api/categories/:id
 * Get single category
 */
router.get('/:id', async (req, res) => {
    try {
        const category = customCategories.find(c => c.id === req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    }
    catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});
/**
 * POST /api/categories
 * Create new category
 */
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        // Check if category with same name exists
        const exists = customCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        // Create new category
        const newCategory = {
            id: Date.now().toString(),
            name,
            description: description || '',
        };
        customCategories.push(newCategory);
        res.status(201).json({
            message: 'Category created successfully',
            data: newCategory,
        });
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryIndex = customCategories.findIndex(c => c.id === req.params.id);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        // Check if new name conflicts with existing categories
        if (name && name !== customCategories[categoryIndex].name) {
            const exists = customCategories.some((c, idx) => idx !== categoryIndex && c.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                return res.status(400).json({ error: 'Category with this name already exists' });
            }
        }
        // Update category
        const updatedCategory = {
            ...customCategories[categoryIndex],
            ...(name && { name }),
            ...(description !== undefined && { description }),
        };
        customCategories[categoryIndex] = updatedCategory;
        res.json({
            message: 'Category updated successfully',
            data: updatedCategory,
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});
/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', async (req, res) => {
    try {
        const categoryIndex = customCategories.findIndex(c => c.id === req.params.id);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const deletedCategory = customCategories[categoryIndex];
        customCategories = customCategories.filter(c => c.id !== req.params.id);
        res.json({
            message: 'Category deleted successfully',
            data: deletedCategory,
        });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
exports.default = router;
//# sourceMappingURL=category.routes.js.map