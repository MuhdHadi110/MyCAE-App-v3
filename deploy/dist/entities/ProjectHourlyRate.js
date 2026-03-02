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
exports.ProjectHourlyRate = void 0;
const typeorm_1 = require("typeorm");
const Project_1 = require("./Project");
const TeamMember_1 = require("./TeamMember");
let ProjectHourlyRate = class ProjectHourlyRate {
};
exports.ProjectHourlyRate = ProjectHourlyRate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectHourlyRate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], ProjectHourlyRate.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", Project_1.Project)
], ProjectHourlyRate.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], ProjectHourlyRate.prototype, "teamMemberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TeamMember_1.TeamMember, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teamMemberId' }),
    __metadata("design:type", TeamMember_1.TeamMember)
], ProjectHourlyRate.prototype, "teamMember", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ProjectHourlyRate.prototype, "hourlyRate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProjectHourlyRate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProjectHourlyRate.prototype, "updatedAt", void 0);
exports.ProjectHourlyRate = ProjectHourlyRate = __decorate([
    (0, typeorm_1.Entity)('project_hourly_rates'),
    (0, typeorm_1.Unique)(['projectId', 'teamMemberId'])
], ProjectHourlyRate);
//# sourceMappingURL=ProjectHourlyRate.js.map