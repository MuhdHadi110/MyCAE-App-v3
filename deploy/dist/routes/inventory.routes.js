"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const InventoryItem_1 = require("../entities/InventoryItem");
const Checkout_1 = require("../entities/Checkout");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const express_validator_1 = require("express-validator");
const n8n_service_1 = __importDefault(require("../services/n8n.service"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// All inventory routes require authentication
router.use(auth_1.authenticate);
// Define roles that can modify inventory (senior-engineer and above)
const INVENTORY_MODIFY_ROLES = [
    User_1.UserRole.SENIOR_ENGINEER,
    User_1.UserRole.PRINCIPAL_ENGINEER,
    User_1.UserRole.MANAGER,
    User_1.UserRole.MANAGING_DIRECTOR,
    User_1.UserRole.ADMIN,
];
// Helper to validate and sanitize pagination params
const validatePagination = (limit, offset) => ({
    limit: Math.min(Math.max(parseInt(String(limit)) || 100, 1), 500), // Max 500 records
    offset: Math.max(parseInt(String(offset)) || 0, 0)
});
/**
 * GET /api/inventory
 * Get all inventory items
 * Authorization: All authenticated users can view inventory
 */
router.get('/', async (req, res) => {
    try {
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const { category, status, lowStock, search, limit = 100, offset = 0 } = req.query;
        const pagination = validatePagination(limit, offset);
        let query = inventoryRepo.createQueryBuilder('item');
        if (category) {
            query.andWhere('item.category = :category', { category });
        }
        if (status) {
            query.andWhere('item.status = :status', { status });
        }
        if (lowStock === 'true') {
            query.andWhere('item.quantity <= item.minimumStock');
        }
        if (search) {
            query.andWhere('(item.title LIKE :search OR item.sku LIKE :search OR item.barcode LIKE :search)', { search: `%${search}%` });
        }
        const [items, total] = await query
            .take(pagination.limit)
            .skip(pagination.offset)
            .getManyAndCount();
        res.json({
            data: items,
            total,
            limit: pagination.limit,
            offset: pagination.offset,
        });
    }
    catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});
/**
 * GET /api/inventory/:id
 * Get single inventory item
 */
router.get('/:id', async (req, res) => {
    try {
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const item = await inventoryRepo.findOne({ where: { id: req.params.id } });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});
/**
 * POST /api/inventory
 * Create new inventory item
 * Requires: senior-engineer or above
 */
router.post('/', (0, auth_1.authorize)(...INVENTORY_MODIFY_ROLES), [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('sku').notEmpty().withMessage('SKU is required'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
    (0, express_validator_1.body)('minimumStock').isInt({ min: 0 }).withMessage('Valid minimum stock is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const checkoutRepo = database_1.AppDataSource.getRepository(Checkout_1.Checkout);
        // Check if SKU already exists
        const existing = await inventoryRepo.findOne({ where: { sku: req.body.sku } });
        if (existing) {
            return res.status(400).json({ error: 'SKU already exists' });
        }
        const item = inventoryRepo.create(req.body);
        // Set the last_action to ADDED for new items
        item.last_action = InventoryItem_1.InventoryLastAction.ADDED;
        item.last_action_date = new Date();
        item.last_action_by = req.user.name || req.user.email;
        await inventoryRepo.save(item);
        // Create an initial "in-stock" checkout record to track the item
        // This represents the item being received/created in inventory
        const initialCheckout = checkoutRepo.create({
            id: (0, uuid_1.v4)(),
            masterBarcode: `REC-${item.sku}-${Date.now()}`, // Receipt barcode
            item_id: item.id,
            user_id: req.user.id, // The user who added the item
            quantity: item.quantity,
            returned_quantity: item.quantity, // Fully "returned" to warehouse = in stock
            checkout_date: new Date(),
            status: Checkout_1.CheckoutStatus.RETURNED, // Status is RETURNED means it's in warehouse
            location: 'Warehouse', // Default location for new items
            purpose: `Item received: ${item.title}`,
        });
        await checkoutRepo.save(initialCheckout);
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});
/**
 * PUT /api/inventory/:id
 * Update inventory item
 * Requires: senior-engineer or above
 */
router.put('/:id', (0, auth_1.authorize)(...INVENTORY_MODIFY_ROLES), async (req, res) => {
    try {
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const item = await inventoryRepo.findOne({ where: { id: req.params.id } });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        const oldQuantity = item.quantity;
        const oldStatus = item.status;
        // Update item
        inventoryRepo.merge(item, req.body);
        // Update status based on quantity
        if (item.quantity === 0) {
            item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (item.quantity <= item.minimumStock) {
            item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
        }
        else {
            item.status = InventoryItem_1.InventoryStatus.AVAILABLE;
        }
        await inventoryRepo.save(item);
        // Trigger low stock alert if newly low
        if (oldStatus !== InventoryItem_1.InventoryStatus.LOW_STOCK &&
            item.status === InventoryItem_1.InventoryStatus.LOW_STOCK) {
            // Trigger n8n workflow
            await n8n_service_1.default.onLowStockAlert({
                itemId: item.id,
                itemName: item.title,
                sku: item.sku,
                currentStock: item.quantity,
                minimumStock: item.minimumStock,
            });
            // Send email notification (you'll need admin email configuration)
            // await emailService.sendLowStockAlert(adminEmail, item.title, item.quantity, item.minimumStock);
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});
/**
 * DELETE /api/inventory/:id
 * Delete inventory item
 * Requires: senior-engineer or above
 * Note: First deletes related checkout records, then deletes the item
 */
router.delete('/:id', (0, auth_1.authorize)(...INVENTORY_MODIFY_ROLES), async (req, res) => {
    try {
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const checkoutRepo = database_1.AppDataSource.getRepository(Checkout_1.Checkout);
        const item = await inventoryRepo.findOne({ where: { id: req.params.id } });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        // Delete all related checkout records first using raw query to bypass foreign key constraints
        const itemId = req.params.id;
        await database_1.AppDataSource.query('DELETE FROM checkouts WHERE item_id = ?', [itemId]);
        console.log(`Deleted checkout records for item ${itemId}`);
        // Then delete the inventory item
        await inventoryRepo.remove(item);
        console.log(`Successfully deleted inventory item ${itemId}`);
        res.json({ message: 'Item deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});
/**
 * POST /api/inventory/bulk
 * Bulk create inventory items
 * Requires: senior-engineer or above
 */
router.post('/bulk/create', (0, auth_1.authorize)(...INVENTORY_MODIFY_ROLES), async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const checkoutRepo = database_1.AppDataSource.getRepository(Checkout_1.Checkout);
        const created = [];
        const errors = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const item = inventoryRepo.create(items[i]);
                await inventoryRepo.save(item);
                created.push(item);
                // Create an initial "in-stock" checkout record for bulk imports
                const initialCheckout = checkoutRepo.create({
                    id: (0, uuid_1.v4)(),
                    masterBarcode: `REC-${item.sku}-${Date.now()}`,
                    item_id: item.id,
                    user_id: req.user.id,
                    quantity: item.quantity,
                    returned_quantity: item.quantity,
                    checkout_date: new Date(),
                    status: Checkout_1.CheckoutStatus.RETURNED,
                    location: 'Warehouse',
                    purpose: `Item received: ${item.title}`,
                });
                await checkoutRepo.save(initialCheckout);
            }
            catch (error) {
                errors.push({ row: i + 1, error: error.message });
            }
        }
        res.json({
            success: created.length > 0,
            imported: created.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            items: created,
        });
    }
    catch (error) {
        console.error('Error bulk creating items:', error);
        res.status(500).json({ error: 'Failed to bulk create items' });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map