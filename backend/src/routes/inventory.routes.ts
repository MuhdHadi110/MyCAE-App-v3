import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InventoryItem, InventoryStatus, InventoryLastAction } from '../entities/InventoryItem';
import { Checkout, CheckoutStatus } from '../entities/Checkout';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';
import n8nService from '../services/n8n.service';
import emailService from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Define roles that can modify inventory (senior-engineer and above)
const INVENTORY_MODIFY_ROLES = [
  UserRole.SENIOR_ENGINEER,
  UserRole.PRINCIPAL_ENGINEER,
  UserRole.MANAGER,
  UserRole.MANAGING_DIRECTOR,
  UserRole.ADMIN,
];

// Helper to validate and sanitize pagination params
const validatePagination = (limit: unknown, offset: unknown) => ({
  limit: Math.min(Math.max(parseInt(String(limit)) || 100, 1), 500), // Max 500 records
  offset: Math.max(parseInt(String(offset)) || 0, 0)
});

/**
 * GET /api/inventory
 * Get all inventory items
 * Authorization: All authenticated users can view inventory
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
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
      query.andWhere(
        '(item.title LIKE :search OR item.sku LIKE :search OR item.barcode LIKE :search)',
        { search: `%${search}%` }
      );
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
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

/**
 * GET /api/inventory/:id
 * Get single inventory item
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const item = await inventoryRepo.findOne({ where: { id: req.params.id } });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

/**
 * POST /api/inventory
 * Create new inventory item
 * Requires: senior-engineer or above
 */
router.post(
  '/',
  authorize(...INVENTORY_MODIFY_ROLES),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
    body('minimumStock').isInt({ min: 0 }).withMessage('Valid minimum stock is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inventoryRepo = AppDataSource.getRepository(InventoryItem);
      const checkoutRepo = AppDataSource.getRepository(Checkout);

      // Check if SKU already exists
      const existing = await inventoryRepo.findOne({ where: { sku: req.body.sku } });
      if (existing) {
        return res.status(400).json({ error: 'SKU already exists' });
      }

      const item = inventoryRepo.create(req.body) as unknown as InventoryItem;
      // Set the last_action to ADDED for new items
      item.last_action = InventoryLastAction.ADDED;
      item.last_action_date = new Date();
      item.last_action_by = req.user!.name || req.user!.email;
      await inventoryRepo.save(item);

      // Create an initial "in-stock" checkout record to track the item
      // This represents the item being received/created in inventory
      const initialCheckout = checkoutRepo.create({
        id: uuidv4(),
        masterBarcode: `REC-${item.sku}-${Date.now()}`, // Receipt barcode
        item_id: item.id,
        user_id: req.user!.id, // The user who added the item
        quantity: item.quantity,
        returned_quantity: item.quantity, // Fully "returned" to warehouse = in stock
        checkout_date: new Date(),
        status: CheckoutStatus.RETURNED, // Status is RETURNED means it's in warehouse
        location: 'Warehouse', // Default location for new items
        purpose: `Item received: ${item.title}`,
      });

      await checkoutRepo.save(initialCheckout);

      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
);

/**
 * PUT /api/inventory/:id
 * Update inventory item
 * Requires: senior-engineer or above
 */
router.put('/:id', authorize(...INVENTORY_MODIFY_ROLES), async (req: AuthRequest, res) => {
  try {
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
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
      item.status = InventoryStatus.OUT_OF_STOCK;
    } else if (item.quantity <= item.minimumStock) {
      item.status = InventoryStatus.LOW_STOCK;
    } else {
      item.status = InventoryStatus.AVAILABLE;
    }

    await inventoryRepo.save(item);

    // Trigger low stock alert if newly low
    if (
      oldStatus !== InventoryStatus.LOW_STOCK &&
      item.status === InventoryStatus.LOW_STOCK
    ) {
      // Trigger n8n workflow
      await n8nService.onLowStockAlert({
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
  } catch (error: any) {
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
router.delete('/:id', authorize(...INVENTORY_MODIFY_ROLES), async (req: AuthRequest, res) => {
  try {
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const checkoutRepo = AppDataSource.getRepository(Checkout);

    const item = await inventoryRepo.findOne({ where: { id: req.params.id } });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete all related checkout records first using raw query to bypass foreign key constraints
    const itemId = req.params.id;
    await AppDataSource.query('DELETE FROM checkouts WHERE item_id = ?', [itemId]);
    console.log(`Deleted checkout records for item ${itemId}`);

    // Then delete the inventory item
    await inventoryRepo.remove(item);
    console.log(`Successfully deleted inventory item ${itemId}`);

    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

/**
 * POST /api/inventory/bulk
 * Bulk create inventory items
 * Requires: senior-engineer or above
 */
router.post('/bulk/create', authorize(...INVENTORY_MODIFY_ROLES), async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const checkoutRepo = AppDataSource.getRepository(Checkout);
    const created: InventoryItem[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = inventoryRepo.create(items[i]) as unknown as InventoryItem;
        await inventoryRepo.save(item);
        created.push(item);

        // Create an initial "in-stock" checkout record for bulk imports
        const initialCheckout = checkoutRepo.create({
          id: uuidv4(),
          masterBarcode: `REC-${item.sku}-${Date.now()}`,
          item_id: item.id,
          user_id: req.user!.id,
          quantity: item.quantity,
          returned_quantity: item.quantity,
          checkout_date: new Date(),
          status: CheckoutStatus.RETURNED,
          location: 'Warehouse',
          purpose: `Item received: ${item.title}`,
        });

        await checkoutRepo.save(initialCheckout);
      } catch (error: any) {
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
  } catch (error: any) {
    console.error('Error bulk creating items:', error);
    res.status(500).json({ error: 'Failed to bulk create items' });
  }
});

export default router;
