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
exports.IssuedPO = exports.IssuedPOStatus = void 0;
const typeorm_1 = require("typeorm");
const Project_1 = require("./Project");
const ReceivedInvoice_1 = require("./ReceivedInvoice");
const Company_1 = require("./Company");
var IssuedPOStatus;
(function (IssuedPOStatus) {
    IssuedPOStatus["ISSUED"] = "issued";
    IssuedPOStatus["RECEIVED"] = "received";
    IssuedPOStatus["COMPLETED"] = "completed";
})(IssuedPOStatus || (exports.IssuedPOStatus = IssuedPOStatus = {}));
let IssuedPO = class IssuedPO {
};
exports.IssuedPO = IssuedPO;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IssuedPO.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], IssuedPO.prototype, "po_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], IssuedPO.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], IssuedPO.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], IssuedPO.prototype, "project_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], IssuedPO.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'MYR' }),
    __metadata("design:type", String)
], IssuedPO.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], IssuedPO.prototype, "amount_myr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], IssuedPO.prototype, "exchange_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], IssuedPO.prototype, "issue_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], IssuedPO.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssuedPOStatus,
        default: IssuedPOStatus.ISSUED,
    }),
    __metadata("design:type", String)
], IssuedPO.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], IssuedPO.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], IssuedPO.prototype, "company_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], IssuedPO.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IssuedPO.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], IssuedPO.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'project_code', referencedColumnName: 'project_code' }),
    __metadata("design:type", Project_1.Project)
], IssuedPO.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ReceivedInvoice_1.ReceivedInvoice, (receivedInvoice) => receivedInvoice.issuedPO),
    __metadata("design:type", Array)
], IssuedPO.prototype, "receivedInvoices", void 0);
exports.IssuedPO = IssuedPO = __decorate([
    (0, typeorm_1.Entity)('issued_pos')
], IssuedPO);
//# sourceMappingURL=IssuedPO.js.map