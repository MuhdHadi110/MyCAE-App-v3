"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const database_1 = require("../config/database");
const TeamMember_1 = require("../entities/TeamMember");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Timesheet_1 = require("../entities/Timesheet");
const email_service_1 = __importDefault(require("./email.service"));
const onboardingPdf_service_1 = require("./onboardingPdf.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
/**
 * Generate a secure random temporary password
 */
const generateTempPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Ensure at least one of each character type
    password += charset.match(/[a-z]/)[0]; // lowercase
    password += charset.match(/[A-Z]/)[0]; // uppercase
    password += charset.match(/[0-9]/)[0]; // number
    password += charset.match(/[!@#$%^&*]/)[0]; // special
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        const randomIndex = crypto_1.default.randomInt(0, charset.length);
        password += charset[randomIndex];
    }
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
class TeamService {
    constructor() {
        this.teamRepo = database_1.AppDataSource.getRepository(TeamMember_1.TeamMember);
        this.userRepo = database_1.AppDataSource.getRepository(User_1.User);
    }
    /**
     * Calculate workload data for team members
     */
    async calculateWorkloadData(userIds) {
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        const timesheetRepo = database_1.AppDataSource.getRepository(Timesheet_1.Timesheet);
        // Get current month's start and end dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Calculate active projects per user
        const activeProjectsQuery = await projectRepo
            .createQueryBuilder('project')
            .select('project.lead_engineer_id', 'userId')
            .addSelect('COUNT(project.id)', 'count')
            .where('project.lead_engineer_id IN (:...userIds)', { userIds })
            .andWhere('project.status = :status', { status: 'ongoing' })
            .groupBy('project.lead_engineer_id')
            .getRawMany();
        // Calculate hours this month per user
        const hoursQuery = await timesheetRepo
            .createQueryBuilder('timesheet')
            .select('timesheet.engineer_id', 'userId')
            .addSelect('SUM(timesheet.hours)', 'hours')
            .where('timesheet.engineer_id IN (:...userIds)', { userIds })
            .andWhere('timesheet.date >= :startDate', { startDate: startOfMonth })
            .andWhere('timesheet.date <= :endDate', { endDate: endOfMonth })
            .groupBy('timesheet.engineer_id')
            .getRawMany();
        // Create a map for easy lookup
        const workloadMap = {};
        userIds.forEach(userId => {
            workloadMap[userId] = { activeProjects: 0, totalHoursThisMonth: 0 };
        });
        activeProjectsQuery.forEach((row) => {
            workloadMap[row.userId] = workloadMap[row.userId] || { activeProjects: 0, totalHoursThisMonth: 0 };
            workloadMap[row.userId].activeProjects = parseInt(row.count);
        });
        hoursQuery.forEach((row) => {
            workloadMap[row.userId] = workloadMap[row.userId] || { activeProjects: 0, totalHoursThisMonth: 0 };
            workloadMap[row.userId].totalHoursThisMonth = parseFloat(row.hours) || 0;
        });
        return workloadMap;
    }
    /**
     * Get all team members with filters
     */
    async getTeamMembers(filters = {}) {
        const { status = 'active', department, search, limit = 100, offset = 0 } = filters;
        let query = this.teamRepo.createQueryBuilder('member')
            .leftJoinAndSelect('member.user', 'user')
            .orderBy('user.name', 'ASC');
        if (status) {
            query = query.where('member.status = :status', { status });
        }
        if (department) {
            query = query.andWhere('member.department = :department', { department });
        }
        if (search) {
            query = query.andWhere('(user.name LIKE :search OR user.email LIKE :search OR member.employee_id LIKE :search)', { search: `%${search}%` });
        }
        const [members, total] = await query
            .take(limit)
            .skip(offset)
            .getManyAndCount();
        // Get user IDs for workload calculation
        const userIds = members.map(m => m.user?.id).filter(Boolean);
        const workloadMap = userIds.length > 0 ? await this.calculateWorkloadData(userIds) : {};
        // Convert to plain JSON
        const plainMembers = members.map(member => {
            const userId = member.user?.id;
            const workload = userId ? workloadMap[userId] : { activeProjects: 0, totalHoursThisMonth: 0 };
            return {
                ...member,
                activeProjects: workload?.activeProjects || 0,
                totalHoursThisMonth: workload?.totalHoursThisMonth || 0,
                user: member.user ? {
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    role: member.user.role,
                    roles: member.user.roles,
                    department: member.user.department,
                    position: member.user.position,
                    avatar: member.user.avatar,
                } : null,
            };
        });
        return {
            data: plainMembers,
            total,
            limit,
            offset,
        };
    }
    /**
     * Get single team member
     */
    async getTeamMemberById(id) {
        const member = await this.teamRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!member) {
            throw new Error('Team member not found');
        }
        return {
            ...member,
            user: member.user ? {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.user.role,
                department: member.user.department,
                position: member.user.position,
                avatar: member.user.avatar,
            } : null,
        };
    }
    /**
     * Create new team member
     */
    async createTeamMember(data) {
        const { name, email, phone, role = 'engineer', department, employment_type = TeamMember_1.EmploymentType.FULL_TIME, userId, ...rest } = data;
        let user;
        let tempPassword = null;
        // If userId is provided, use existing user
        if (userId) {
            user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error('User not found');
            }
        }
        else {
            // Create new user if name and email provided
            const existingUser = await this.userRepo.findOne({ where: { email } });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            tempPassword = generateTempPassword();
            const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
            // Set password expiry to 7 days from now
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            const newUser = this.userRepo.create({
                name,
                email,
                password_hash: hashedPassword,
                role: role,
                temp_password_expires: expiryDate,
                is_temp_password: true,
            });
            await this.userRepo.save(newUser);
            // Reload user to ensure all getters/setters are properly applied
            user = await this.userRepo.findOne({ where: { id: newUser.id } });
            if (!user) {
                throw new Error('Failed to create user');
            }
        }
        // Check if team member already exists for this user
        const existing = await this.teamRepo.findOne({ where: { user_id: user.id } });
        if (existing) {
            throw new Error('Team member already exists for this user');
        }
        const member = this.teamRepo.create({
            user_id: user.id,
            phone,
            department,
            status: 'active',
            employment_type,
            ...rest,
        });
        const savedMember = await this.teamRepo.save(member);
        const fullMember = await this.teamRepo.findOne({
            where: { id: savedMember.id },
            relations: ['user'],
        });
        // Send welcome email for new users
        let emailSent = false;
        let emailError = null;
        if (!userId && tempPassword && user) {
            try {
                // Generate onboarding PDF
                const pdfBuffer = await onboardingPdf_service_1.OnboardingPdfService.generateOnboardingGuide(name);
                // Send welcome email with PDF
                await email_service_1.default.sendWelcomeEmail(email, name, tempPassword, user.temp_password_expires, pdfBuffer);
                emailSent = true;
                logger_1.logger.info('Welcome email sent', { email });
            }
            catch (err) {
                emailError = err.message;
                logger_1.logger.error('Failed to send welcome email', { email, error: err.message });
            }
        }
        // Return response
        const response = fullMember;
        if (!userId && tempPassword) {
            response.tempPassword = tempPassword;
            if (emailSent) {
                response.message = `New user created successfully. Welcome email with login credentials sent to ${email}.`;
                response.emailStatus = 'sent';
            }
            else {
                response.message = `New user created successfully but welcome email failed to send. Please manually share the password with the user.`;
                response.emailStatus = 'failed';
                response.emailError = emailError;
            }
        }
        return response;
    }
    /**
     * Update team member
     */
    async updateTeamMember(id, data, currentUserId, currentUserRole) {
        const member = await this.teamRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!member) {
            throw new Error('Team member not found');
        }
        // Authorization checks
        const userRole = currentUserRole || 'engineer';
        // Check if user is editing their own profile
        const isEditingSelf = member.user_id === currentUserId;
        // If not editing self, check if they have permission to edit other team members
        if (!isEditingSelf) {
            const allowedRoles = ['admin', 'managing-director', 'manager', 'principal-engineer'];
            if (!allowedRoles.includes(userRole)) {
                throw new Error('Only Principal Engineers, Managers, Managing Directors, and Admins can edit team members');
            }
        }
        const user = member.user;
        if (!user) {
            throw new Error('User not found for this team member');
        }
        // Separate user fields from team member fields
        const { role, roles, name, email, phone, department, avatar, ...teamMemberFields } = data;
        // Update User table fields (name, email, roles, avatar)
        let userUpdated = false;
        if (name && name !== user.name) {
            user.name = name;
            userUpdated = true;
        }
        if (email && email !== user.email) {
            user.email = email;
            userUpdated = true;
        }
        // Handle roles (can be single role or array of roles)
        const rolesToUpdate = roles || (role ? [role] : null);
        if (rolesToUpdate) {
            // Prevent users from changing their own role
            if (isEditingSelf) {
                throw new Error('You cannot change your own roles. Contact an administrator.');
            }
            const validRoles = [
                User_1.UserRole.ENGINEER,
                User_1.UserRole.SENIOR_ENGINEER,
                User_1.UserRole.PRINCIPAL_ENGINEER,
                User_1.UserRole.MANAGER,
                User_1.UserRole.MANAGING_DIRECTOR,
                User_1.UserRole.ADMIN,
            ];
            // Ensure all roles are valid
            const rolesArray = Array.isArray(rolesToUpdate) ? rolesToUpdate : [rolesToUpdate];
            const invalidRoles = rolesArray.filter(r => !validRoles.includes(r));
            if (invalidRoles.length > 0) {
                throw new Error(`Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${validRoles.join(', ')}`);
            }
            user.roles = rolesArray;
            userUpdated = true;
        }
        if (avatar) {
            const validAvatarPattern = /^(male|female)-(0[1-9]|10)$/;
            if (validAvatarPattern.test(avatar)) {
                user.avatar = avatar;
                userUpdated = true;
            }
        }
        if (userUpdated) {
            await this.userRepo.save(user);
            member.user = user;
        }
        // Update TeamMember table fields (phone, department, etc.)
        let teamMemberUpdated = false;
        if (phone !== undefined) {
            member.phone = phone;
            teamMemberUpdated = true;
        }
        if (department && department !== member.department) {
            member.department = department;
            teamMemberUpdated = true;
        }
        // Update any other team member fields
        if (Object.keys(teamMemberFields).length > 0) {
            this.teamRepo.merge(member, teamMemberFields);
            teamMemberUpdated = true;
        }
        if (teamMemberUpdated) {
            await this.teamRepo.save(member);
        }
        // Return the updated member
        return {
            ...member,
            user: member.user ? {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.user.role,
                roles: member.user.roles,
                department: member.user.department,
                position: member.user.position,
                avatar: member.user.avatar,
            } : null,
        };
    }
    /**
     * Deactivate team member (soft delete)
     */
    async deactivateTeamMember(id) {
        const member = await this.teamRepo.findOne({
            where: { id },
            relations: ['user']
        });
        if (!member) {
            throw new Error('Team member not found');
        }
        member.status = 'inactive';
        await this.teamRepo.save(member);
        return { message: 'Team member deactivated successfully' };
    }
    /**
     * Reactivate team member
     */
    async reactivateTeamMember(id) {
        const member = await this.teamRepo.findOne({
            where: { id },
            relations: ['user']
        });
        if (!member) {
            throw new Error('Team member not found');
        }
        if (member.status === 'active') {
            throw new Error('Team member is already active');
        }
        member.status = 'active';
        await this.teamRepo.save(member);
        return {
            message: 'Team member reactivated successfully',
            data: {
                ...member,
                user: member.user ? {
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    role: member.user.role,
                    roles: member.user.roles,
                    department: member.user.department,
                    position: member.user.position,
                    avatar: member.user.avatar,
                } : null,
            }
        };
    }
    /**
     * Get team members by department
     */
    async getTeamMembersByDepartment(department, filters = {}) {
        const { limit = 100, offset = 0 } = filters;
        const [members, total] = await this.teamRepo
            .createQueryBuilder('member')
            .leftJoinAndSelect('member.user', 'user')
            .where('member.department = :department', { department })
            .andWhere('member.status = :status', { status: 'active' })
            .orderBy('user.name', 'ASC')
            .take(limit)
            .skip(offset)
            .getManyAndCount();
        // Get user IDs for workload calculation
        const userIds = members.map(m => m.user?.id).filter(Boolean);
        const workloadMap = userIds.length > 0 ? await this.calculateWorkloadData(userIds) : {};
        // Convert to plain JSON
        const plainMembers = members.map(member => {
            const userId = member.user?.id;
            const workload = userId ? workloadMap[userId] : { activeProjects: 0, totalHoursThisMonth: 0 };
            return {
                ...member,
                activeProjects: workload?.activeProjects || 0,
                totalHoursThisMonth: workload?.totalHoursThisMonth || 0,
                user: member.user ? {
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    role: member.user.role,
                    roles: member.user.roles,
                    department: member.user.department,
                    position: member.user.position,
                    avatar: member.user.avatar,
                } : null,
            };
        });
        return {
            data: plainMembers,
            total,
            limit,
            offset,
        };
    }
}
exports.TeamService = TeamService;
exports.default = new TeamService();
//# sourceMappingURL=team.service.js.map