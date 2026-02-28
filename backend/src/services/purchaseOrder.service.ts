import { AppDataSource } from '../config/database';
import { PurchaseOrder, POStatus } from '../entities/PurchaseOrder';
import { Project, ProjectStatus } from '../entities/Project';
import { CurrencyService } from './currency.service';
import { Repository } from 'typeorm';

export class PurchaseOrderService {
  private _poRepo: Repository<PurchaseOrder> | null = null;

  private get poRepo(): Repository<PurchaseOrder> {
    if (!this._poRepo) {
      this._poRepo = AppDataSource.getRepository(PurchaseOrder);
    }
    return this._poRepo;
  }

  /**
   * Create a new revision of an existing PO
   */
  async createRevision(
    originalPOId: string,
    newData: {
      amount: number;
      currency: string;
      receivedDate: Date;
      description?: string;
      fileUrl?: string;
      revisionReason: string;
    },
    userId: string
  ): Promise<PurchaseOrder> {
    // 1. Get original PO
    const originalPO = await this.poRepo.findOne({
      where: { id: originalPOId },
      relations: ['project'],
    });

    if (!originalPO) {
      throw new Error('Original PO not found');
    }

    if (!originalPO.is_active) {
      throw new Error('Cannot create revision from inactive PO');
    }

    if (originalPO.status === POStatus.PAID) {
      throw new Error('Cannot revise paid PO');
    }

    // 2. Get exchange rate for new revision date
    let amountMYR = newData.amount;
    let exchangeRate = 1.0;

    if (newData.currency !== 'MYR') {
      const conversion = await CurrencyService.convertToMYR(
        newData.amount,
        newData.currency
      );
      amountMYR = conversion.amountMYR;
      exchangeRate = conversion.rate;
    }

    // 3. Create new PO revision
    const newRevisionNumber = originalPO.revision_number + 1;
    const newPONumber = newRevisionNumber > 1
      ? `${originalPO.po_number_base} Rev ${newRevisionNumber}`
      : originalPO.po_number_base;

    const newRevision = this.poRepo.create({
      po_number: newPONumber,
      po_number_base: originalPO.po_number_base,
      project_code: originalPO.project_code,
      client_name: originalPO.client_name,
      amount: newData.amount,
      currency: newData.currency.toUpperCase(),
      amount_myr: amountMYR,
      exchange_rate: exchangeRate,
      received_date: newData.receivedDate,
      due_date: originalPO.due_date, // Copy from original
      description: newData.description || originalPO.description,
      status: originalPO.status, // Inherit status
      file_url: newData.fileUrl,
      revision_number: newRevisionNumber,
      is_active: true,
      supersedes: originalPO.id,
      revision_date: new Date(),
      revision_reason: newData.revisionReason,
    });

    // 4. Save in transaction
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Save new revision first to get its ID
      const savedNewRevision = await transactionalEntityManager.save(PurchaseOrder, newRevision);

      // Update original PO
      originalPO.is_active = false;
      originalPO.superseded_by = savedNewRevision.id;
      await transactionalEntityManager.save(PurchaseOrder, originalPO);

      return savedNewRevision;
    });
  }

  /**
   * Get all revisions for a PO number
   */
  async getRevisionHistory(poNumberBase: string): Promise<PurchaseOrder[]> {
    return await this.poRepo.find({
      where: { po_number_base: poNumberBase },
      relations: ['project', 'adjustedByUser'],
      order: { revision_number: 'ASC' },
    });
  }

  /**
   * Get active revision for a PO number base
   */
  async getActiveRevision(poNumberBase: string): Promise<PurchaseOrder | null> {
    return await this.poRepo.findOne({
      where: { po_number_base: poNumberBase, is_active: true },
      relations: ['project'],
    });
  }

  /**
   * Check if project already has an active PO
   * Returns the active PO if found, null otherwise
   */
  async getActivePOByProjectCode(projectCode: string): Promise<PurchaseOrder | null> {
    return await this.poRepo.findOne({
      where: { 
        project_code: projectCode,
        is_active: true,
      },
    });
  }

  /**
   * Manually adjust MYR amount (for fees, taxes, etc.)
   */
  async adjustMYRAmount(
    poId: string,
    adjustedAmount: number,
    reason: string,
    userId: string
  ): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({ where: { id: poId } });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (!po.is_active) {
      throw new Error('Cannot adjust inactive PO');
    }

    if (adjustedAmount <= 0) {
      throw new Error('Adjusted amount must be positive');
    }

    // Validate adjustment isn't too large (> 50%)
    const difference = Math.abs(adjustedAmount - po.amount_myr);
    const percentDiff = (difference / po.amount_myr) * 100;

    if (percentDiff > 50) {
      throw new Error(
        `Adjustment too large (${percentDiff.toFixed(1)}%). Please create a revision instead.`
      );
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error('Adjustment reason must be at least 10 characters');
    }

    // Update adjustment fields
    po.amount_myr_adjusted = adjustedAmount;
    po.adjustment_reason = reason;
    po.adjusted_by = userId;
    po.adjusted_at = new Date();

    return await this.poRepo.save(po);
  }

/**
 * Get all active POs (default query for analytics)
 */
async getAllActivePOs(filters?: {
  project_code?: string;
  status?: POStatus;
  limit?: number;
  offset?: number;
}): Promise<{ data: PurchaseOrder[]; total: number }> {
  const query = this.poRepo
    .createQueryBuilder('po')
    .leftJoinAndSelect('po.project', 'project')
    .leftJoinAndSelect('project.company', 'company')
    .select([
      'po',
      'project',
      'company',
    ])
    .where('po.is_active = :isActive', { isActive: true })
    .orderBy('po.received_date', 'DESC');

  if (filters?.project_code) {
    query.andWhere('po.project_code = :project_code', {
      project_code: filters.project_code,
    });
  }

  if (filters?.status) {
    query.andWhere('po.status = :status', { status: filters.status });
  }

  if (filters?.limit) {
    query.take(filters.limit);
  }

  if (filters?.offset) {
    query.skip(filters.offset);
  }

  const [data, total] = await query.getManyAndCount();
  return { data, total };
}

  /**
   * Get PO by ID
   */
  async getById(id: string): Promise<PurchaseOrder | null> {
    return await this.poRepo.findOne({
      where: { id },
      relations: ['project', 'project.contact', 'project.company'],
    });
  }

  /**
   * Create new PO
   */
  async createPO(data: {
    poNumber: string;
    projectCode: string;
    clientName: string;
    amount: number;
    currency?: string;
    receivedDate: Date;
    dueDate?: Date;
    description?: string;
    status?: POStatus;
    fileUrl?: string;
    plannedHours?: number;
    customExchangeRate?: number;
  }): Promise<PurchaseOrder> {
    const poRepo = AppDataSource.getRepository(PurchaseOrder);
    const projectRepo = AppDataSource.getRepository(require('../entities/Project').Project);

    // Check if PO number already exists
    const existingPO = await poRepo.findOne({ where: { po_number: data.poNumber } });
    if (existingPO) {
      throw new Error('Purchase order with this PO number already exists');
    }

    // Find the project by project code
    const project = await projectRepo.findOne({ where: { project_code: data.projectCode } });
    if (!project) {
      throw new Error(`Project with code ${data.projectCode} not found`);
    }

    // Convert to MYR if not already
    let amountMYR = data.amount;
    let exchangeRate = 1.0;
    let rateSource: 'auto' | 'manual' | null = null;

    if (data.currency && data.currency !== 'MYR') {
      if (data.customExchangeRate) {
        // Use custom rate
        exchangeRate = data.customExchangeRate;
        amountMYR = data.amount * exchangeRate;
        rateSource = 'manual';
      } else {
        // Auto-fetch rate
        try {
          const conversion = await CurrencyService.convertToMYR(data.amount, data.currency);
          amountMYR = conversion.amountMYR;
          exchangeRate = conversion.rate;
          rateSource = 'auto';
        } catch (error: any) {
          throw new Error(`Currency conversion failed: ${error.message}`);
        }
      }
    }

    // Create the purchase order
    const po = poRepo.create({
      po_number: data.poNumber,
      project_code: data.projectCode,
      client_name: data.clientName,
      amount: data.amount,
      currency: (data.currency || 'MYR').toUpperCase(),
      amount_myr: amountMYR,
      exchange_rate: exchangeRate,
      exchange_rate_source: rateSource,
      received_date: data.receivedDate,
      due_date: data.dueDate,
      description: data.description,
      status: data.status || POStatus.RECEIVED,
      file_url: data.fileUrl,
    });

    const savedPO = await poRepo.save(po);

    // Automatically update project status from 'pre-lim' to 'ongoing' when PO is received
    const ProjectStatus = require('../entities/Project').ProjectStatus;
    if (project.status === ProjectStatus.PRE_LIM) {
      console.log(`📋 Updating project ${data.projectCode} status from pre-lim to ongoing`);
      project.status = ProjectStatus.ONGOING;
      project.po_received_date = data.receivedDate;
      if (data.plannedHours !== undefined && data.plannedHours > 0) {
        console.log(`📊 Updating project ${data.projectCode} planned hours from ${project.planned_hours} to ${data.plannedHours}`);
        project.planned_hours = data.plannedHours;
      }
      await projectRepo.save(project);
      console.log(`✅ Project ${data.projectCode} status updated to ongoing`);
    }

    return savedPO;
  }

  /**
   * Update PO
   */
  async updatePO(id: string, updates: any): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({ where: { id } });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Apply basic updates
    const basicUpdates = { ...updates };
    delete basicUpdates.currency;
    delete basicUpdates.customExchangeRate;
    Object.assign(po, basicUpdates);

    // Handle currency and exchange rate updates
    if (updates.currency || updates.customExchangeRate !== undefined) {
      const currency = updates.currency || po.currency;
      const amount = po.amount;

      if (currency !== 'MYR') {
        if (updates.customExchangeRate !== undefined && updates.customExchangeRate !== null) {
          // Use custom rate
          po.currency = currency;
          po.exchange_rate = updates.customExchangeRate;
          po.amount_myr = amount * updates.customExchangeRate;
          po.exchange_rate_source = 'manual';
        } else if (po.exchange_rate_source !== 'manual') {
          // Keep existing rate if not manual, don't auto-refetch
          po.currency = currency;
        }
      } else {
        // Switching to MYR
        po.currency = 'MYR';
        po.exchange_rate = 1.0;
        po.amount_myr = amount;
        po.exchange_rate_source = null;
      }
    } else if (updates.currency === 'MYR') {
      // Explicitly switching to MYR
      po.currency = 'MYR';
      po.exchange_rate = 1.0;
      po.amount_myr = po.amount;
      po.exchange_rate_source = null;
    }

    const updatedPO = await this.poRepo.save(po);

    // Fetch with relations
    return await this.poRepo.findOne({
      where: { id: updatedPO.id },
      relations: ['project'],
    }) as PurchaseOrder;
  }

  /**
   * Delete PO
   * Also reverts project status from 'ongoing' to 'pre-lim' if no POs remain
   */
  async deletePO(id: string): Promise<void> {
    const po = await this.poRepo.findOne({ where: { id } });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    const projectCode = po.project_code;

    // Delete associated file if exists
    if (po.file_url) {
      const { deleteFile } = require('../utils/fileUpload');
      deleteFile(po.file_url);
    }

    await this.poRepo.remove(po);

    // Check if any POs remain for this project
    const remainingPOs = await this.poRepo.count({
      where: { project_code: projectCode }
    });

    // If no POs remain, revert project status from 'ongoing' to 'pre-lim'
    if (remainingPOs === 0) {
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({ where: { project_code: projectCode } });

      if (project && project.status === ProjectStatus.ONGOING) {
        console.log(`📋 Reverting project ${projectCode} status from ongoing to pre-lim (all POs deleted)`);
        project.status = ProjectStatus.PRE_LIM;
        project.po_received_date = undefined;
        await projectRepo.save(project);
        console.log(`✅ Project ${projectCode} status reverted to pre-lim`);
      }
    }
  }

  /**
   * Calculate total revenue for project (active POs only)
   */
  async calculateProjectRevenue(projectCode: string): Promise<number> {
    const result = await this.poRepo
      .createQueryBuilder('po')
      .select(
        'COALESCE(SUM(COALESCE(po.amount_myr_adjusted, po.amount_myr)), 0)',
        'total'
      )
      .where('po.project_code = :projectCode', { projectCode })
      .andWhere('po.is_active = :isActive', { isActive: true })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }
}
