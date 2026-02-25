/**
 * Start the exchange rate scheduler
 * Call this function once after database is initialized
 */
export declare function startExchangeRateScheduler(): void;
/**
 * Stop the exchange rate scheduler
 * Call this during graceful shutdown
 */
export declare function stopExchangeRateScheduler(): void;
/**
 * Manually trigger an exchange rate import
 * Useful for testing or on-demand updates
 */
export declare function triggerManualImport(): Promise<void>;
/**
 * Check if the scheduler is currently running
 */
export declare function isSchedulerActive(): boolean;
declare const _default: {
    startExchangeRateScheduler: typeof startExchangeRateScheduler;
    stopExchangeRateScheduler: typeof stopExchangeRateScheduler;
    triggerManualImport: typeof triggerManualImport;
    isSchedulerActive: typeof isSchedulerActive;
};
export default _default;
//# sourceMappingURL=exchangeRateScheduler.service.d.ts.map