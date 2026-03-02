"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const database_1 = require("../config/database");
const PurchaseOrder_1 = require("../entities/PurchaseOrder");
const Project_1 = require("../entities/Project");
const currency_service_1 = require("./currency.service");
const structureStatus_service_1 = require("./structureStatus.service");
class PurchaseOrderService {
    constructor() {
        this._poRepo = null;
    }
    get poRepo() {
        if (!this._poRepo) {
            this._poRepo = database_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        }
        return this._poRepo;
    }
    /**
     * Create a new revision of an existing PO
     */
    async createRevision(originalPOId, newData, userId) {
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
        if (originalPO.status === PurchaseOrder_1.POStatus.PAID) {
            throw new Error('Cannot revise paid PO');
        }
        // 2. Get exchange rate for new revision date
        let amountMYR = newData.amount;
        let exchangeRate = 1.0;
        if (newData.currency !== 'MYR') {
            const conversion = await currency_service_1.CurrencyService.convertToMYR(newData.amount, newData.currency);
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
        return await database_1.AppDataSource.transaction(async (transactionalEntityManager) => {
            // Save new revision first to get its ID
            const savedNewRevision = await transactionalEntityManager.save(PurchaseOrder_1.PurchaseOrder, newRevision);
            // Update original PO
            originalPO.is_active = false;
            originalPO.superseded_by = savedNewRevision.id;
            await transactionalEntityManager.save(PurchaseOrder_1.PurchaseOrder, originalPO);
            return savedNewRevision;
        });
    }
    /**
     * Get all revisions for a PO number
     */
    async getRevisionHistory(poNumberBase) {
        return await this.poRepo.find({
            where: { po_number_base: poNumberBase },
            relations: ['project', 'adjustedByUser'],
            order: { revision_number: 'ASC' },
        });
    }
    /**
     * Get active revision for a PO number base
     */
    async getActiveRevision(poNumberBase) {
        return await this.poRepo.findOne({
            where: { po_number_base: poNumberBase, is_active: true },
            relations: ['project'],
        });
    }
    /**
     * Check if project already has an active PO
     * Returns the active PO if found, null otherwise
     */
    async getActivePOByProjectCode(projectCode) {
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
    async adjustMYRAmount(poId, adjustedAmount, reason, userId) {
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
            throw new Error(`Adjustment too large (${percentDiff.toFixed(1)}%). Please create a revision instead.`);
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
    async getAllActivePOs(filters) {
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
    async getById(id) {
        return await this.poRepo.findOne({
            where: { id },
            relations: ['project', 'project.contact', 'project.company'],
        });
    }
    /**
     * Create new PO
     */
    async createPO(data) {
        const poRepo = database_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        const projectRepo = database_1.AppDataSource.getRepository(require('../entities/Project').Project);
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
        let rateSource = null;
        if (data.currency && data.currency !== 'MYR') {
            if (data.customExchangeRate) {
                // Use custom rate
                exchangeRate = data.customExchangeRate;
                amountMYR = data.amount * exchangeRate;
                rateSource = 'manual';
            }
            else {
                // Auto-fetch rate
                try {
                    const conversion = await currency_service_1.CurrencyService.convertToMYR(data.amount, data.currency);
                    amountMYR = conversion.amountMYR;
                    exchangeRate = conversion.rate;
                    rateSource = 'auto';
                }
                catch (error) {
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
            status: data.status || PurchaseOrder_1.POStatus.RECEIVED,
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
        // Sync container status if this is a structure child
        if (project.project_type === Project_1.ProjectType.STRUCTURE_CHILD && project.parent_project_id) {
            console.log(`🔄 Syncing container status for structure ${data.projectCode}`);
            await structureStatus_service_1.StructureStatusService.syncContainerStatus(project.parent_project_id);
        }
        return savedPO;
    }
    /**
     * Update PO
     */
    async updatePO(id, updates) {
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
                }
                else if (po.exchange_rate_source !== 'manual') {
                    // Keep existing rate if not manual, don't auto-refetch
                    po.currency = currency;
                }
            }
            else {
                // Switching to MYR
                po.currency = 'MYR';
                po.exchange_rate = 1.0;
                po.amount_myr = amount;
                po.exchange_rate_source = null;
            }
        }
        else if (updates.currency === 'MYR') {
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
        });
    }
    /**
     * Delete PO
     * Also reverts project status from 'ongoing' to 'pre-lim' if no POs remain
     */
    async deletePO(id) {
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
            const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
            const project = await projectRepo.findOne({ where: { project_code: projectCode } });
            if (project && project.status === Project_1.ProjectStatus.ONGOING) {
                console.log(`📋 Reverting project ${projectCode} status from ongoing to pre-lim (all POs deleted)`);
                project.status = Project_1.ProjectStatus.PRE_LIM;
                project.po_received_date = undefined;
                await projectRepo.save(project);
                console.log(`✅ Project ${projectCode} status reverted to pre-lim`);
            }
        }
    }
    /**
     * Calculate total revenue for project (active POs only)
     */
    async calculateProjectRevenue(projectCode) {
        const result = await this.poRepo
            .createQueryBuilder('po')
            .select('COALESCE(SUM(COALESCE(po.amount_myr_adjusted, po.amount_myr)), 0)', 'total')
            .where('po.project_code = :projectCode', { projectCode })
            .andWhere('po.is_active = :isActive', { isActive: true })
            .getRawOne();
        return parseFloat(result.total) || 0;
    }
}
exports.PurchaseOrderService = PurchaseOrderService;
//# sourceMappingURL=purchaseOrder.service.js.map