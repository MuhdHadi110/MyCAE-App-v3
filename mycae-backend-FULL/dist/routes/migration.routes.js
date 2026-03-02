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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const Project_1 = require("../entities/Project");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: path.join(__dirname, '../../uploads/migrations'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.json', '.csv'].includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JSON and CSV files are allowed'));
        }
    },
});
// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/migrations');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
/**
 * POST /api/migration/upload
 * Upload and process migration file
 */
router.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const ext = path.extname(fileName).toLowerCase();
        let projectsToMigrate = [];
        // Parse file based on extension
        if (ext === '.json') {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            projectsToMigrate = data.projects || data;
        }
        else if (ext === '.csv') {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            projectsToMigrate = lines.slice(1).map(line => {
                if (!line.trim())
                    return null;
                const values = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            }).filter(Boolean);
        }
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        // Return parsed data for preview
        res.json({
            fileName,
            totalProjects: projectsToMigrate.length,
            projects: projectsToMigrate.slice(0, 10), // First 10 for preview
            isPreview: projectsToMigrate.length > 10,
        });
    }
    catch (error) {
        // Clean up on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error processing migration file:', error);
        res.status(400).json({
            error: 'Failed to process file',
            details: error.message,
        });
    }
});
/**
 * POST /api/migration/execute
 * Execute project migration
 */
router.post('/execute', auth_1.authenticate, async (req, res) => {
    try {
        const { projects } = req.body;
        if (!Array.isArray(projects) || projects.length === 0) {
            return res.status(400).json({ error: 'No projects provided' });
        }
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const result = {
            success: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };
        for (const projectData of projects) {
            try {
                // Check if project already exists
                const existing = await projectRepo.findOne({
                    where: { project_code: projectData.project_code }
                });
                if (existing) {
                    result.skipped++;
                    result.details.push({
                        code: projectData.project_code,
                        status: 'skipped',
                        message: 'Project code already exists',
                    });
                    continue;
                }
                // Validate required fields
                if (!projectData.project_code || !projectData.title ||
                    !projectData.client_id || !projectData.manager_id) {
                    result.errors++;
                    result.details.push({
                        code: projectData.project_code || 'unknown',
                        status: 'error',
                        message: 'Missing required fields (project_code, title, client_id, manager_id)',
                    });
                    continue;
                }
                // Parse and validate date
                let startDate;
                try {
                    startDate = new Date(projectData.start_date);
                    if (isNaN(startDate.getTime())) {
                        throw new Error('Invalid date');
                    }
                }
                catch (error) {
                    result.errors++;
                    result.details.push({
                        code: projectData.project_code,
                        status: 'error',
                        message: `Invalid start_date: ${projectData.start_date}`,
                    });
                    continue;
                }
                // Create and save project
                const project = projectRepo.create({
                    project_code: projectData.project_code,
                    title: projectData.title,
                    client_id: projectData.client_id,
                    manager_id: projectData.manager_id,
                    lead_engineer_id: projectData.lead_engineer_id || undefined,
                    status: (projectData.status || 'pre-lim'),
                    start_date: startDate,
                    planned_hours: parseInt(String(projectData.planned_hours || 0)),
                    actual_hours: parseInt(String(projectData.actual_hours || 0)),
                    remarks: projectData.remarks || undefined,
                    completion_date: projectData.completion_date ? new Date(projectData.completion_date) : undefined,
                    po_received_date: projectData.po_received_date ? new Date(projectData.po_received_date) : undefined,
                    invoiced_date: projectData.invoiced_date ? new Date(projectData.invoiced_date) : undefined,
                });
                await projectRepo.save(project);
                result.success++;
                result.details.push({
                    code: projectData.project_code,
                    status: 'success',
                    message: `Migrated: ${projectData.title}`,
                });
            }
            catch (error) {
                result.errors++;
                result.details.push({
                    code: projectData.project_code || 'unknown',
                    status: 'error',
                    message: error.message,
                });
            }
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error executing migration:', error);
        res.status(500).json({
            error: 'Migration failed',
            details: error.message,
        });
    }
});
/**
 * GET /api/migration/template
 * Get migration template (JSON and CSV examples)
 */
router.get('/template', auth_1.authenticate, async (req, res) => {
    try {
        const jsonTemplate = {
            projects: [
                {
                    project_code: 'J24001',
                    title: 'Example Project',
                    client_id: 'client-uuid-here',
                    manager_id: 'manager-uuid-here',
                    lead_engineer_id: 'engineer-uuid-here',
                    status: 'completed',
                    start_date: '2024-01-15',
                    planned_hours: 100,
                    actual_hours: 98,
                    remarks: 'Example project',
                    completion_date: '2024-06-30',
                    po_received_date: '2024-01-20',
                    invoiced_date: '2024-07-15',
                },
            ],
        };
        const csvTemplate = 'project_code,title,client_id,manager_id,lead_engineer_id,status,start_date,planned_hours,actual_hours,remarks,completion_date,po_received_date,invoiced_date\n' +
            'J24001,Example Project,client-uuid,manager-uuid,engineer-uuid,completed,2024-01-15,100,98,Example project,2024-06-30,2024-01-20,2024-07-15';
        res.json({
            json: jsonTemplate,
            csv: csvTemplate,
        });
    }
    catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to get template' });
    }
});
exports.default = router;
//# sourceMappingURL=migration.routes.js.map