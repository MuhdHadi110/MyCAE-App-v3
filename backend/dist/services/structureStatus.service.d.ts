/**
 * Service for managing structure container status auto-sync
 * Automatically updates container status based on children status
 */
export declare class StructureStatusService {
    private static projectRepo;
    private static getProjectRepo;
    /**
     * Calculate and update container status based on children
     * Called whenever a child's status changes
     */
    static syncContainerStatus(containerId: string): Promise<void>;
    /**
     * Calculate container status from children
     * - All completed → completed
     * - Any ongoing → ongoing
     * - All pre-lim → pre-lim
     */
    private static calculateContainerStatus;
    /**
     * Get structure children count and statuses for UI display
     */
    static getContainerStats(containerId: string): Promise<{
        totalStructures: number;
        ongoingCount: number;
        completedCount: number;
        prelimCount: number;
        autoStatus: string;
    } | null>;
    /**
     * Get next structure number for a container
     * Finds the highest _N suffix and returns N+1
     */
    static getNextStructureNumber(containerId: string): Promise<number>;
    /**
     * Generate next structure code
     * e.g., J25143 → J25143_1, J25143_2, etc.
     */
    static generateStructureCode(containerId: string): Promise<string>;
}
//# sourceMappingURL=structureStatus.service.d.ts.map