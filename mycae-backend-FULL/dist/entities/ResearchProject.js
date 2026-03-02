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
exports.ResearchProject = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const uuid_1 = require("uuid");
let ResearchProject = class ResearchProject {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.ResearchProject = ResearchProject;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], ResearchProject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], ResearchProject.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { name: 'research_code', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "researchCode", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { name: 'lead_researcher_id', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "leadResearcherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_researcher_id' }),
    __metadata("design:type", User_1.User)
], ResearchProject.prototype, "leadResearcher", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['planning', 'in-progress', 'on-hold', 'completed', 'archived'],
        default: 'planning'
    }),
    __metadata("design:type", String)
], ResearchProject.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('datetime', { name: 'start_date', nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)('datetime', { name: 'planned_end_date', nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "plannedEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)('datetime', { name: 'actual_end_date', nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "actualEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { name: 'funding_source', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "fundingSource", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255, nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "objectives", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "methodology", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "findings", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "publications", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { name: 'team_members', nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "teamMembers", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "collaborators", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { name: 'equipment_used', nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "equipmentUsed", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], ResearchProject.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ResearchProject.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ResearchProject.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ResearchProject.prototype, "generateId", null);
exports.ResearchProject = ResearchProject = __decorate([
    (0, typeorm_1.Entity)('research_projects')
], ResearchProject);
//# sourceMappingURL=ResearchProject.js.map