"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const ProjectHourlyRate_1 = require("../entities/ProjectHourlyRate");
const Project_1 = require("../entities/Project");
const TeamMember_1 = require("../entities/TeamMember");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const projectHourlyRateRepository = database_1.AppDataSource.getRepository(ProjectHourlyRate_1.ProjectHourlyRate);
const projectRepository = database_1.AppDataSource.getRepository(Project_1.Project);
const teamMemberRepository = database_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
// Get hourly rates for a specific project
router.get('/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        // Verify project exists
        const project = await projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const rates = await projectHourlyRateRepository.find({
            where: { projectId },
            relations: ['teamMember', 'teamMember.user'],
            order: { createdAt: 'DESC' },
        });
        res.json({
            success: true,
            data: rates.map(rate => ({
                id: rate.id,
                projectId: rate.projectId,
                teamMemberId: rate.teamMemberId,
                engineerName: rate.teamMember?.user?.name || 'Unknown',
                hourlyRate: parseFloat(rate.hourlyRate),
                createdAt: rate.createdAt,
                updatedAt: rate.updatedAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching hourly rates:', error);
        res.status(500).json({ error: 'Failed to fetch hourly rates' });
    }
});
// Upsert hourly rates for a project (bulk update)
router.put('/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { rates } = req.body; // rates: Record<teamMemberId, number>
        if (!rates || typeof rates !== 'object') {
            return res.status(400).json({ error: 'Rates object is required' });
        }
        // Verify project exists
        const project = await projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const updatedRates = [];
        for (const [teamMemberId, hourlyRate] of Object.entries(rates)) {
            const rate = parseFloat(hourlyRate);
            if (isNaN(rate) || rate < 0) {
                return res.status(400).json({ error: `Invalid hourly rate for team member ${teamMemberId}` });
            }
            // Verify team member exists
            const teamMember = await teamMemberRepository.findOne({ where: { id: teamMemberId } });
            if (!teamMember) {
                return res.status(404).json({ error: `Team member ${teamMemberId} not found` });
            }
            // Find existing rate or create new one
            let projectRate = await projectHourlyRateRepository.findOne({
                where: {
                    projectId,
                    teamMemberId,
                },
            });
            if (projectRate) {
                projectRate.hourlyRate = rate;
                await projectHourlyRateRepository.save(projectRate);
            }
            else {
                projectRate = projectHourlyRateRepository.create({
                    projectId,
                    teamMemberId,
                    hourlyRate: rate,
                });
                await projectHourlyRateRepository.save(projectRate);
            }
            updatedRates.push({
                teamMemberId,
                hourlyRate: rate,
            });
        }
        res.json({
            success: true,
            message: 'Hourly rates updated successfully',
            data: updatedRates,
        });
    }
    catch (error) {
        console.error('Error updating hourly rates:', error);
        res.status(500).json({ error: 'Failed to update hourly rates' });
    }
});
// Get single hourly rate
router.get('/rate/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const rate = await projectHourlyRateRepository.findOne({
            where: { id },
            relations: ['project', 'teamMember'],
        });
        if (!rate) {
            return res.status(404).json({ error: 'Hourly rate not found' });
        }
        res.json({
            success: true,
            data: {
                id: rate.id,
                projectId: rate.projectId,
                teamMemberId: rate.teamMemberId,
                hourlyRate: parseFloat(rate.hourlyRate),
                createdAt: rate.createdAt,
                updatedAt: rate.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Error fetching hourly rate:', error);
        res.status(500).json({ error: 'Failed to fetch hourly rate' });
    }
});
// Delete hourly rate
router.delete('/:projectId/:teamMemberId', auth_1.authenticate, async (req, res) => {
    try {
        const { projectId, teamMemberId } = req.params;
        const result = await projectHourlyRateRepository.delete({
            projectId,
            teamMemberId,
        });
        if (result.affected === 0) {
            return res.status(404).json({ error: 'Hourly rate not found' });
        }
        res.json({
            success: true,
            message: 'Hourly rate deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting hourly rate:', error);
        res.status(500).json({ error: 'Failed to delete hourly rate' });
    }
});
exports.default = router;
//# sourceMappingURL=projectHourlyRate.routes.js.map