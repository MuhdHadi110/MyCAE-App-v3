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
exports.Timesheet = exports.WorkCategory = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const User_1 = require("./User");
const Project_1 = require("./Project");
var WorkCategory;
(function (WorkCategory) {
    WorkCategory["ENGINEERING"] = "engineering";
    WorkCategory["PROJECT_MANAGEMENT"] = "project-management";
    WorkCategory["MEASUREMENT_SITE"] = "measurement-site";
    WorkCategory["MEASUREMENT_OFFICE"] = "measurement-office";
})(WorkCategory || (exports.WorkCategory = WorkCategory = {}));
let Timesheet = class Timesheet {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.Timesheet = Timesheet;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], Timesheet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Timesheet.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", Project_1.Project)
], Timesheet.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Timesheet.prototype, "engineer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'engineer_id' }),
    __metadata("design:type", User_1.User)
], Timesheet.prototype, "engineer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Timesheet.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Timesheet.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkCategory,
    }),
    __metadata("design:type", String)
], Timesheet.prototype, "work_category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Timesheet.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Timesheet.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Timesheet.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Timesheet.prototype, "generateId", null);
exports.Timesheet = Timesheet = __decorate([
    (0, typeorm_1.Entity)('timesheets')
], Timesheet);
//# sourceMappingURL=Timesheet.js.map