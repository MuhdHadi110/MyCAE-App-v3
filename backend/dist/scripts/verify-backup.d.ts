interface VerificationResult {
    valid: boolean;
    checks: {
        fileExists: boolean;
        fileSize: number;
        isCompressed: boolean;
        canDecompress: boolean;
        hasValidSql: boolean;
        tableCount: number;
        hasKeyTables: boolean;
        missingTables: string[];
    };
    errors: string[];
}
declare function verifyBackup(backupFile: string): Promise<VerificationResult>;
export { verifyBackup };
//# sourceMappingURL=verify-backup.d.ts.map