import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Checkout, CheckoutStatus } from '../entities/Checkout';
import { User } from '../entities/User';
import { InventoryItem } from '../entities/InventoryItem';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import {
  decreaseInventoryQuantity,
  increaseInventoryQuantity,
  validateCheckoutAvailability,
  getInventoryItem,
} from '../utils/inventorySync';
import n8nService from '../services/n8n.service';

const router = Router();

// All checkout routes require authentication
router.use(authenticate);

/**
 * Helper: Generate master barcode for bulk checkouts
 */
function generateMasterBarcode(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MCO-${date}-${random}`;
}

/**
 * POST /api/checkouts/single
 * Create single item checkout
 */
router.post(
  '/single',
  [
    body('itemBarcode').notEmpty().withMessage('Item barcode/SKU is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { itemBarcode, quantity, expectedReturnDate, purpose, location, notes } = req.body;

      // Validate item availability
      const validation = await validateCheckoutAvailability(itemBarcode, quantity);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const item = validation.item!;

      // Start transaction
      const checkoutRepo = AppDataSource.getRepository(Checkout);

      // Decrease inventory
      const inventoryUpdate = await decreaseInventoryQuantity(itemBarcode, quantity);
      if (!inventoryUpdate.success) {
        return res.status(400).json({ error: inventoryUpdate.error });
      }

      // Create checkout record
      const checkout = checkoutRepo.create({
        masterBarcode: `SINGLE-${Date.now()}-${item.sku}`,
        item_id: item.id,
        user_id: req.user.id,
        quantity,
        returned_quantity: 0,
        checkout_date: new Date(),
        expected_return_date: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
        status: CheckoutStatus.CHECKED_OUT,
        purpose,
        location,
        notes,
      });

      await checkoutRepo.save(checkout);

      // Trigger n8n workflow
      await n8nService.onCheckoutCreated({
        checkoutId: checkout.id,
        itemName: item.title,
        quantity,
        checkedOutBy: req.user.name || 'Unknown User',
        location,
        purpose,
      });

      res.status(201).json({
        success: true,
        checkoutId: checkout.id,
        masterBarcode: checkout.masterBarcode,
        message: `Successfully checked out ${quantity} x ${item.title}`,
      });
    } catch (error: any) {
      console.error('Error creating single checkout:', error);
      res.status(500).json({ error: 'Failed to create checkout' });
    }
  }
);

/**
 * POST /api/checkouts/bulk
 * Create bulk checkout with master barcode
 */
router.post(
  '/bulk',
  [body('items').isArray({ min: 1 }).withMessage('Items array is required')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { items, expectedReturnDate, purpose, notes } = req.body;
      const masterBarcode = generateMasterBarcode();

      // Validate all items first
      const validations = await Promise.all(
        items.map((item: any) =>
          validateCheckoutAvailability(item.barcode, item.quantity)
        )
      );

      const invalidItem = validations.find((v) => !v.valid);
      if (invalidItem) {
        return res.status(400).json({ error: invalidItem.error });
      }

      const checkoutRepo = AppDataSource.getRepository(Checkout);
      const createdCheckouts = [];

      // Use database transaction for atomicity
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create checkout for each item
        for (let i = 0; i < items.length; i++) {
          const itemData = items[i];
          const validation = validations[i];
          const inventoryItem = validation.item!;

          // Decrease inventory
          const inventoryUpdate = await decreaseInventoryQuantity(
            itemData.barcode,
            itemData.quantity
          );

          if (!inventoryUpdate.success) {
            // Transaction will be rolled back automatically in catch block
            throw new Error(`Failed to checkout ${inventoryItem.title}: ${inventoryUpdate.error}`);
          }

          // Create checkout record
          const checkout = checkoutRepo.create({
            masterBarcode,
            item_id: inventoryItem.id,
            user_id: req.user.id,
            quantity: itemData.quantity,
            returned_quantity: 0,
            checkout_date: new Date(),
            expected_return_date: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
            status: CheckoutStatus.CHECKED_OUT,
            purpose,
            notes,
          });

          await queryRunner.manager.save(checkout);
          createdCheckouts.push(checkout);
        }

        // Commit transaction if all operations succeeded
        await queryRunner.commitTransaction();
      } catch (error: any) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          error: error.message || 'Bulk checkout failed',
        });
      } finally {
        // Release query runner
        await queryRunner.release();
      }

      // Trigger n8n workflow
      await n8nService.onCheckoutCreated({
        masterBarcode,
        itemCount: items.length,
        checkedOutBy: req.user.name || 'Unknown User',
        purpose,
      });

      res.status(201).json({
        success: true,
        masterBarcode,
        checkoutsCreated: createdCheckouts.length,
        message: `Successfully checked out ${createdCheckouts.length} items`,
      });
    } catch (error: any) {
      console.error('Error creating bulk checkout:', error);
      res.status(500).json({ error: 'Failed to create bulk checkout' });
    }
  }
);

/**
 * POST /api/checkouts/checkin/single
 * Check in single item
 */
router.post(
  '/checkin/single',
  [
    body('itemBarcode').notEmpty().withMessage('Item barcode/SKU is required'),
    body('quantityToReturn').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { itemBarcode, quantityToReturn, condition, notes } = req.body;

      // Find active checkout for this item and user
      const checkoutRepo = AppDataSource.getRepository(Checkout);
      const item = await getInventoryItem(itemBarcode);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const activeCheckout = await checkoutRepo
        .createQueryBuilder('checkout')
        .where('checkout.item_id = :itemId', { itemId: item.id })
        .andWhere('checkout.user_id = :userId', { userId: req.user!.id })
        .andWhere('checkout.status IN (:...statuses)', {
          statuses: [CheckoutStatus.CHECKED_OUT, CheckoutStatus.PARTIAL_RETURN],
        })
        .andWhere('checkout.quantity > checkout.returned_quantity')
        .orderBy('checkout.checkout_date', 'DESC')
        .getOne();

      if (!activeCheckout) {
        return res.status(404).json({
          error: 'No active checkout found for this item',
        });
      }

      const remainingQuantity = activeCheckout.quantity - activeCheckout.returned_quantity;

      if (quantityToReturn > remainingQuantity) {
        return res.status(400).json({
          error: `Cannot return ${quantityToReturn}. Only ${remainingQuantity} checked out.`,
        });
      }

      // Increase inventory
      const inventoryUpdate = await increaseInventoryQuantity(itemBarcode, quantityToReturn);
      if (!inventoryUpdate.success) {
        return res.status(400).json({ error: inventoryUpdate.error });
      }

      // Update checkout
      activeCheckout.returned_quantity += quantityToReturn;
      activeCheckout.condition = condition;
      activeCheckout.notes = notes || activeCheckout.notes;

      if (activeCheckout.returned_quantity === activeCheckout.quantity) {
        // Full return
        activeCheckout.status = CheckoutStatus.RETURNED;
        activeCheckout.actual_return_date = new Date();
      } else {
        // Partial return
        activeCheckout.status = CheckoutStatus.PARTIAL_RETURN;
      }

      await checkoutRepo.save(activeCheckout);

      res.json({
        success: true,
        message: `Successfully returned ${quantityToReturn} x ${item.title}`,
        checkoutStatus: activeCheckout.status,
        remainingQuantity: activeCheckout.quantity - activeCheckout.returned_quantity,
      });
    } catch (error: any) {
      console.error('Error checking in single item:', error);
      res.status(500).json({ error: 'Failed to check in item' });
    }
  }
);

/**
 * POST /api/checkouts/checkin/bulk
 * Check in items using master barcode (full or partial)
 */
router.post(
  '/checkin/bulk',
  [body('masterBarcode').notEmpty().withMessage('Master barcode is required')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { masterBarcode, returnType, items, notes } = req.body;

      const checkoutRepo = AppDataSource.getRepository(Checkout);

      // Find all checkouts with this master barcode
      const checkouts = await checkoutRepo
        .createQueryBuilder('checkout')
        .leftJoinAndSelect('checkout.item', 'item')
        .where('checkout.masterBarcode = :masterBarcode', { masterBarcode })
        .andWhere('checkout.status IN (:...statuses)', {
          statuses: [CheckoutStatus.CHECKED_OUT, CheckoutStatus.PARTIAL_RETURN],
        })
        .getMany();

      if (checkouts.length === 0) {
        return res.status(404).json({
          error: 'No active checkouts found with this master barcode',
        });
      }

      let returnedCount = 0;

      if (returnType === 'full') {
        // Return all remaining items
        for (const checkout of checkouts) {
          const remainingQty = checkout.quantity - checkout.returned_quantity;

          if (remainingQty > 0) {
            // Increase inventory
            await increaseInventoryQuantity(checkout.item_id, remainingQty);

            // Update checkout
            checkout.returned_quantity = checkout.quantity;
            checkout.status = CheckoutStatus.RETURNED;
            checkout.actual_return_date = new Date();
            checkout.notes = notes || checkout.notes;

            await checkoutRepo.save(checkout);
            returnedCount++;
          }
        }
      } else {
        // Partial return - return specific items
        for (const itemToReturn of items || []) {
          const checkout = checkouts.find((c) => c.item_id === itemToReturn.itemId);

          if (!checkout) continue;

          const remainingQty = checkout.quantity - checkout.returned_quantity;
          const returnQty = Math.min(itemToReturn.quantityToReturn, remainingQty);

          if (returnQty > 0) {
            // Increase inventory
            await increaseInventoryQuantity(checkout.item_id, returnQty);

            // Update checkout
            checkout.returned_quantity += returnQty;
            checkout.notes = notes || checkout.notes;

            if (checkout.returned_quantity === checkout.quantity) {
              checkout.status = CheckoutStatus.RETURNED;
              checkout.actual_return_date = new Date();
            } else {
              checkout.status = CheckoutStatus.PARTIAL_RETURN;
            }

            await checkoutRepo.save(checkout);
            returnedCount++;
          }
        }
      }

      res.json({
        success: true,
        message: `Successfully processed ${returnedCount} returns`,
        returnType,
        masterBarcode,
      });
    } catch (error: any) {
      console.error('Error checking in bulk items:', error);
      res.status(500).json({ error: 'Failed to check in items' });
    }
  }
);

/**
 * GET /api/checkouts
 * Get all checkouts
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const checkoutRepo = AppDataSource.getRepository(Checkout);

    const checkouts = await checkoutRepo
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.item', 'item')
      .leftJoinAndSelect('checkout.user', 'user')
      .orderBy('checkout.checkout_date', 'DESC')
      .getMany();

    // Group by master barcode for frontend
    const groupedByMasterBarcode = new Map();

    checkouts.forEach((checkout) => {
      const key = checkout.masterBarcode;

      if (!groupedByMasterBarcode.has(key)) {
        groupedByMasterBarcode.set(key, {
          id: checkout.id,
          masterBarcode: checkout.masterBarcode,
          checkedOutBy: checkout.user.name,
          checkedOutByEmail: checkout.user.email,
          checkedOutDate: checkout.checkout_date,
          expectedReturnDate: checkout.expected_return_date,
          purpose: checkout.purpose,
          notes: checkout.notes,
          status: checkout.status,
          items: [],
          totalItems: 0,
          returnedItems: 0,
          remainingItems: 0,
        });
      }

      const group = groupedByMasterBarcode.get(key);
      const remainingQty = checkout.quantity - checkout.returned_quantity;

      group.items.push({
        id: checkout.id,
        itemId: checkout.item_id,
        itemName: checkout.item.title,
        barcode: checkout.item.barcode || checkout.item.sku,
        quantity: checkout.quantity,
        returnedQuantity: checkout.returned_quantity,
        remainingQuantity: remainingQty,
        returnStatus: remainingQty > 0 ? 'checked-out' : 'returned',
        returnDate: checkout.actual_return_date,
      });

      group.totalItems += checkout.quantity;
      group.returnedItems += checkout.returned_quantity;
      group.remainingItems += remainingQty;

      // Update overall status
      if (group.remainingItems === 0) {
        group.status = 'fully-returned';
      } else if (group.returnedItems > 0) {
        group.status = 'partial-return';
      } else if (
        group.remainingItems > 0 &&
        group.expectedReturnDate &&
        new Date(group.expectedReturnDate) < new Date()
      ) {
        group.status = 'overdue';
      } else {
        group.status = 'active';
      }
    });

    const result = Array.from(groupedByMasterBarcode.values());

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch checkouts' });
  }
});

/**
 * GET /api/checkouts/:masterBarcode
 * Get checkout by master barcode
 */
router.get('/:masterBarcode', async (req: AuthRequest, res: Response) => {
  try {
    const { masterBarcode } = req.params;

    const checkoutRepo = AppDataSource.getRepository(Checkout);

    const checkouts = await checkoutRepo
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.item', 'item')
      .leftJoinAndSelect('checkout.user', 'user')
      .where('checkout.masterBarcode = :masterBarcode', { masterBarcode })
      .getMany();

    if (checkouts.length === 0) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    // Build response
    const firstCheckout = checkouts[0];
    const response = {
      id: firstCheckout.id,
      masterBarcode: firstCheckout.masterBarcode,
      checkedOutBy: firstCheckout.user.name,
      checkedOutByEmail: firstCheckout.user.email,
      checkedOutDate: firstCheckout.checkout_date,
      expectedReturnDate: firstCheckout.expected_return_date,
      purpose: firstCheckout.purpose,
      notes: firstCheckout.notes,
      status: firstCheckout.status,
      items: checkouts.map((c) => ({
        id: c.id,
        itemId: c.item_id,
        itemName: c.item.title,
        barcode: c.item.barcode || c.item.sku,
        quantity: c.quantity,
        returnedQuantity: c.returned_quantity,
        remainingQuantity: c.quantity - c.returned_quantity,
        returnStatus: c.quantity - c.returned_quantity > 0 ? 'checked-out' : 'returned',
        returnDate: c.actual_return_date,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({ error: 'Failed to fetch checkout' });
  }
});

export default router;
