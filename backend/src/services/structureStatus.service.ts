import { AppDataSource } from '../config/database';
import { Project, ProjectStatus, ProjectType } from '../entities/Project';
import { Repository } from 'typeorm';

/**
 * Service for managing structure container status auto-sync
 * Automatically updates container status based on children status
 */
export class StructureStatusService {
  private static projectRepo: Repository<Project>;

  private static getProjectRepo(): Repository<Project> {
    if (!this.projectRepo) {
      this.projectRepo = AppDataSource.getRepository(Project);
    }
    return this.projectRepo;
  }

  /**
   * Calculate and update container status based on children
   * Called whenever a child's status changes
   */
  static async syncContainerStatus(containerId: string): Promise<void> {
    const projectRepo = this.getProjectRepo();

    // Get container
    const container = await projectRepo.findOne({
      where: { id: containerId },
    });

    if (!container) {
      console.log(`⚠️ Container ${containerId} not found`);
      return;
    }

    // Only process structure containers
    if (container.project_type !== ProjectType.STRUCTURE_CONTAINER) {
      return;
    }

    // Get all structure children
    const children = await projectRepo.find({
      where: {
        parent_project_id: containerId,
        project_type: ProjectType.STRUCTURE_CHILD,
      },
    });

    if (children.length === 0) {
      console.log(`📂 Container ${container.project_code} has no structures yet`);
      return;
    }

    // Calculate new status
    const newStatus = this.calculateContainerStatus(children);

    // Only update if status changed
    if (container.status !== newStatus) {
      console.log(`🔄 Updating container ${container.project_code} status: ${container.status} → ${newStatus}`);
      
      container.status = newStatus;
      
      // Set dates based on status
      if (newStatus === ProjectStatus.ONGOING && !container.po_received_date) {
        container.po_received_date = new Date();
      }
      
      if (newStatus === ProjectStatus.COMPLETED && !container.completion_date) {
        container.completion_date = new Date();
      }

      await projectRepo.save(container);
      
      console.log(`✅ Container ${container.project_code} status updated to ${newStatus}`);
    }
  }

  /**
   * Calculate container status from children
   * - All completed → completed
   * - Any ongoing → ongoing
   * - All pre-lim → pre-lim
   */
  private static calculateContainerStatus(children: Project[]): ProjectStatus {
    const allCompleted = children.every(child => child.status === ProjectStatus.COMPLETED);
    if (allCompleted) {
      return ProjectStatus.COMPLETED;
    }

    const anyOngoing = children.some(child => 
      child.status === ProjectStatus.ONGOING || child.status === ProjectStatus.COMPLETED
    );
    if (anyOngoing) {
      return ProjectStatus.ONGOING;
    }

    return ProjectStatus.PRE_LIM;
  }

  /**
   * Get structure children count and statuses for UI display
   */
  static async getContainerStats(containerId: string): Promise<{
    totalStructures: number;
    ongoingCount: number;
    completedCount: number;
    prelimCount: number;
    autoStatus: string;
  } | null> {
    const projectRepo = this.getProjectRepo();

    const container = await projectRepo.findOne({
      where: { id: containerId },
    });

    if (!container || container.project_type !== ProjectType.STRUCTURE_CONTAINER) {
      return null;
    }

    const children = await projectRepo.find({
      where: {
        parent_project_id: containerId,
        project_type: ProjectType.STRUCTURE_CHILD,
      },
    });

    const ongoingCount = children.filter(c => c.status === ProjectStatus.ONGOING).length;
    const completedCount = children.filter(c => c.status === ProjectStatus.COMPLETED).length;
    const prelimCount = children.filter(c => c.status === ProjectStatus.PRE_LIM).length;

    return {
      totalStructures: children.length,
      ongoingCount,
      completedCount,
      prelimCount,
      autoStatus: `Auto: ${container.status} (${ongoingCount + completedCount} of ${children.length})`,
    };
  }

  /**
   * Get next structure number for a container
   * Finds the highest _N suffix and returns N+1
   */
  static async getNextStructureNumber(containerId: string): Promise<number> {
    const projectRepo = this.getProjectRepo();

    const container = await projectRepo.findOne({
      where: { id: containerId },
    });

    if (!container) {
      throw new Error('Container not found');
    }

    // Find all structure children
    const children = await projectRepo.find({
      where: {
        parent_project_id: containerId,
        project_type: ProjectType.STRUCTURE_CHILD,
      },
    });

    if (children.length === 0) {
      return 1;
    }

    // Extract structure numbers from project codes
    const structureNumbers = children
      .map(child => {
        const match = child.project_code.match(/_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumber = structureNumbers.length > 0 ? Math.max(...structureNumbers) : 0;
    return maxNumber + 1;
  }

  /**
   * Generate next structure code
   * e.g., J25143 → J25143_1, J25143_2, etc.
   */
  static async generateStructureCode(containerId: string): Promise<string> {
    const projectRepo = this.getProjectRepo();

    const container = await projectRepo.findOne({
      where: { id: containerId },
    });

    if (!container) {
      throw new Error('Container not found');
    }

    const nextNumber = await this.getNextStructureNumber(containerId);
    return `${container.project_code}_${nextNumber}`;
  }
}
