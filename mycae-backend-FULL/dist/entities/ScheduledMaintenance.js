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
exports.ScheduledMaintenance = exports.InventoryAction = exports.MaintenanceType = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const InventoryItem_1 = require("./InventoryItem");
const User_1 = require("./User");
var MaintenanceType;
(function (MaintenanceType) {
    MaintenanceType["CALIBRATION"] = "calibration";
    MaintenanceType["INSPECTION"] = "inspection";
    MaintenanceType["SERVICING"] = "servicing";
    MaintenanceType["REPLACEMENT"] = "replacement";
    MaintenanceType["OTHER"] = "other";
})(MaintenanceType || (exports.MaintenanceType = MaintenanceType = {}));
var InventoryAction;
(function (InventoryAction) {
    InventoryAction["DEDUCT"] = "deduct";
    InventoryAction["STATUS_ONLY"] = "status-only";
    InventoryAction["NONE"] = "none";
})(InventoryAction || (exports.InventoryAction = InventoryAction = {}));
let ScheduledMaintenance = class ScheduledMaintenance {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.ScheduledMaintenance = ScheduledMaintenance;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "item_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryItem_1.InventoryItem),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", InventoryItem_1.InventoryItem)
], ScheduledMaintenance.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: MaintenanceType,
        default: MaintenanceType.OTHER,
    }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "maintenance_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], ScheduledMaintenance.prototype, "scheduled_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ScheduledMaintenance.prototype, "is_completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ScheduledMaintenance.prototype, "completed_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "completed_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'completed_by' }),
    __metadata("design:type", User_1.User)
], ScheduledMaintenance.prototype, "completedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "ticket_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ScheduledMaintenance.prototype, "reminder_14_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ScheduledMaintenance.prototype, "reminder_7_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ScheduledMaintenance.prototype, "reminder_1_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryAction,
        default: InventoryAction.NONE,
    }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "inventory_action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ScheduledMaintenance.prototype, "quantity_affected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ScheduledMaintenance.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", User_1.User)
], ScheduledMaintenance.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduledMaintenance.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduledMaintenance.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScheduledMaintenance.prototype, "generateId", null);
exports.ScheduledMaintenance = ScheduledMaintenance = __decorate([
    (0, typeorm_1.Entity)('scheduled_maintenance')
], ScheduledMaintenance);
//# sourceMappingURL=ScheduledMaintenance.js.map