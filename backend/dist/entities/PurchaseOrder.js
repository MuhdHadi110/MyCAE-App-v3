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
exports.PurchaseOrder = exports.POStatus = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Project_1 = require("./Project");
const User_1 = require("./User");
const Company_1 = require("./Company");
var POStatus;
(function (POStatus) {
    POStatus["RECEIVED"] = "received";
    POStatus["IN_PROGRESS"] = "in-progress";
    POStatus["INVOICED"] = "invoiced";
    POStatus["PAID"] = "paid";
})(POStatus || (exports.POStatus = POStatus = {}));
let PurchaseOrder = class PurchaseOrder {
    // Computed property: Use adjusted amount if present, else calculated amount
    get effective_amount_myr() {
        return this.amount_myr_adjusted ?? this.amount_myr;
    }
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
        // Set default values for revision fields if not already set
        if (!this.revision_number) {
            this.revision_number = 1;
        }
        if (this.is_active === undefined) {
            this.is_active = true;
        }
        if (!this.revision_date) {
            this.revision_date = new Date();
        }
        if (!this.po_number_base) {
            this.po_number_base = this.po_number;
        }
    }
};
exports.PurchaseOrder = PurchaseOrder;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "po_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "project_code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_code', referencedColumnName: 'project_code' }),
    __metadata("design:type", Project_1.Project)
], PurchaseOrder.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "client_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'MYR' }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "amount_myr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "exchange_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['auto', 'manual'], nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "exchange_rate_source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "received_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: POStatus,
        default: POStatus.RECEIVED,
    }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "revision_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PurchaseOrder.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "superseded_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "supersedes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "revision_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "revision_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "amount_myr_adjusted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "adjustment_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "adjusted_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "adjusted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "po_number_base", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PurchaseOrder, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'supersedes' }),
    __metadata("design:type", PurchaseOrder)
], PurchaseOrder.prototype, "previousRevision", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PurchaseOrder, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'superseded_by' }),
    __metadata("design:type", PurchaseOrder)
], PurchaseOrder.prototype, "nextRevision", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'adjusted_by' }),
    __metadata("design:type", User_1.User)
], PurchaseOrder.prototype, "adjustedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "company_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], PurchaseOrder.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PurchaseOrder.prototype, "generateId", null);
exports.PurchaseOrder = PurchaseOrder = __decorate([
    (0, typeorm_1.Entity)('purchase_orders')
], PurchaseOrder);
//# sourceMappingURL=PurchaseOrder.js.map