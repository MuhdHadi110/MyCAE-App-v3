"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTeamMember = exports.ProjectTeamRole = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Project_1 = require("./Project");
const TeamMember_1 = require("./TeamMember");
var ProjectTeamRole;
(function (ProjectTeamRole) {
    ProjectTeamRole["LEAD_ENGINEER"] = "lead_engineer";
    ProjectTeamRole["ENGINEER"] = "engineer";
})(ProjectTeamRole || (exports.ProjectTeamRole = ProjectTeamRole = {}));
let ProjectTeamMember = class ProjectTeamMember {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.ProjectTeamMember = ProjectTeamMember;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], ProjectTeamMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProjectTeamMember.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, (project) => project.teamMembers),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", Project_1.Project)
], ProjectTeamMember.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProjectTeamMember.prototype, "team_member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TeamMember_1.TeamMember),
    (0, typeorm_1.JoinColumn)({ name: 'team_member_id' }),
    __metadata("design:type", TeamMember_1.TeamMember)
], ProjectTeamMember.prototype, "teamMember", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProjectTeamRole,
        default: ProjectTeamRole.ENGINEER,
    }),
    __metadata("design:type", String)
], ProjectTeamMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProjectTeamMember.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProjectTeamMember.prototype, "generateId", null);
exports.ProjectTeamMember = ProjectTeamMember = __decorate([
    (0, typeorm_1.Entity)('project_team_members')
], ProjectTeamMember);
//# sourceMappingURL=ProjectTeamMember.js.map