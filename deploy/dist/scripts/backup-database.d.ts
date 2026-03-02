interface BackupConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    backupDir: string;
    retentionDays: number;
}
interface IntegrityCheckResult {
    query: string;
    description: string;
    count: number;
    details?: any[];
}
declare function runIntegrityChecks(): Promise<IntegrityCheckResult[]>;
declare function createBackup(config: BackupConfig): Promise<string>;
export { createBackup, runIntegrityChecks };
//# sourceMappingURL=backup-database.d.ts.map