interface RestoreConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    backupFile: string;
    testMode: boolean;
}
interface RestoreResult {
    success: boolean;
    databaseRestored: string;
    rowCounts: Record<string, number>;
    errors: string[];
    warnings: string[];
}
declare function restoreDatabase(config: RestoreConfig): Promise<RestoreResult>;
export { restoreDatabase };
//# sourceMappingURL=restore-database.d.ts.map