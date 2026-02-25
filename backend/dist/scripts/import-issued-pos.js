"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const IssuedPO_1 = require("../entities/IssuedPO");
const XLSX = __importStar(require("xlsx"));
const uuid_1 = require("uuid");
const EXCEL_PATH = 'C:/Users/User/Desktop/For mycae app/MyCAE Outgoing PO Tracking for claude.xlsx';
/**
 * Extract project code from items description if present
 * e.g., "J22081 Vibration, Acoustic and EMF Measurement" → "J22081"
 */
function extractProjectCodeFromItems(items) {
    if (!items)
        return null;
    const match = items.match(/^([A-Z]\d+[_\d]*)/);
    return match ? match[1] : null;
}
async function importIssuedPOs() {
    console.log('🚀 Starting issued PO import from Excel...\n');
    try {
        // Initialize database
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected\n');
        // Read Excel file
        const workbook = XLSX.readFile(EXCEL_PATH);
        const worksheet = workbook.Sheets['Purchase Orders'];
        if (!worksheet) {
            throw new Error('Sheet "Purchase Orders" not found');
        }
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
        console.log(`📊 Found ${data.length - 1} issued PO rows in Excel\n`);
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        // Skip header row
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            // Skip empty rows
            if (!row[0] && !row[1] && !row[2]) {
                continue;
            }
            try {
                const items = row[0] || '';
                const recipient = row[1] || '';
                const poNumber = row[2] || '';
                if (!poNumber || !items || !recipient) {
                    console.log(`⚠️  Row ${i + 1}: Skipping - missing required fields`);
                    skipped++;
                    continue;
                }
                // Check if PO already exists
                const existing = await issuedPORepo.findOne({ where: { po_number: poNumber } });
                if (existing) {
                    console.log(`⏭️  Row ${i + 1}: Issued PO ${poNumber} already exists`);
                    skipped++;
                    continue;
                }
                // Try to extract project code from items description
                const projectCode = extractProjectCodeFromItems(items);
                // Create issued PO
                // Note: Excel doesn't have amount or dates, so we'll set defaults
                const issuedPO = new IssuedPO_1.IssuedPO();
                issuedPO.id = (0, uuid_1.v4)();
                issuedPO.po_number = poNumber;
                issuedPO.items = items;
                issuedPO.recipient = recipient;
                issuedPO.project_code = projectCode || '';
                issuedPO.amount = 0; // Excel doesn't have amount
                issuedPO.issue_date = new Date(); // Default to current date
                issuedPO.status = IssuedPO_1.IssuedPOStatus.ISSUED; // Assume issued
                await issuedPORepo.save(issuedPO);
                imported++;
                if (imported % 10 === 0) {
                    console.log(`✅ Imported ${imported} issued POs...`);
                }
            }
            catch (error) {
                console.error(`❌ Row ${i + 1}: Error - ${error.message}`);
                errors++;
            }
        }
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Import completed!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped:  ${skipped}`);
        console.log(`   Errors:   ${errors}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        console.log(`ℹ️  Note: Excel file doesn't contain amounts or dates.`);
        console.log(`   All POs were imported with default values (amount=0, issue_date=today).`);
        console.log(`   You can update these manually later.\n`);
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}
// Run import
importIssuedPOs();
//# sourceMappingURL=import-issued-pos.js.map