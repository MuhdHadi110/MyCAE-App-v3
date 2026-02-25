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
exports.Project = exports.BillingType = exports.ProjectStatus = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
const ProjectTeamMember_1 = require("./ProjectTeamMember");
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PRE_LIM"] = "pre-lim";
    ProjectStatus["ONGOING"] = "ongoing";
    ProjectStatus["COMPLETED"] = "completed";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var BillingType;
(function (BillingType) {
    BillingType["HOURLY"] = "hourly";
    BillingType["LUMP_SUM"] = "lump_sum";
})(BillingType || (exports.BillingType = BillingType = {}));
let Project = class Project {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Project.prototype, "project_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Project.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Project.prototype, "company_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "contact_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Contact_1.Contact),
    (0, typeorm_1.JoinColumn)({ name: 'contact_id' }),
    __metadata("design:type", Contact_1.Contact)
], Project.prototype, "contact", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], Project.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "parent_project_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "is_variation_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Project.prototype, "vo_number", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project, (project) => project.variationOrders, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_project_id' }),
    __metadata("design:type", Project)
], Project.prototype, "parentProject", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Project, (project) => project.parentProject),
    __metadata("design:type", Array)
], Project.prototype, "variationOrders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProjectTeamMember_1.ProjectTeamMember, (ptm) => ptm.project),
    __metadata("design:type", Array)
], Project.prototype, "teamMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.PRE_LIM,
    }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BillingType,
        default: BillingType.HOURLY,
        name: 'billing_type',
    }),
    __metadata("design:type", String)
], Project.prototype, "billing_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Project.prototype, "inquiry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Project.prototype, "po_received_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "po_file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Project.prototype, "completion_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Project.prototype, "invoiced_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Project.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Project.prototype, "planned_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "hourly_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Project.prototype, "actual_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "lead_engineer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'lead_engineer_id' }),
    __metadata("design:type", User_1.User)
], Project.prototype, "lead_engineer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Project.prototype, "manager_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", User_1.User)
], Project.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Project.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Project.prototype, "generateId", null);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);
//# sourceMappingURL=Project.js.map