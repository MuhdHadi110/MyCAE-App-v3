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
exports.MaintenanceTicket = exports.TicketStatus = exports.TicketPriority = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const User_1 = require("./User");
const InventoryItem_1 = require("./InventoryItem");
const ScheduledMaintenance_1 = require("./ScheduledMaintenance");
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
    TicketPriority["CRITICAL"] = "critical";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in-progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
let MaintenanceTicket = class MaintenanceTicket {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.MaintenanceTicket = MaintenanceTicket;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "item_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryItem_1.InventoryItem),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", InventoryItem_1.InventoryItem)
], MaintenanceTicket.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "reported_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'reported_by' }),
    __metadata("design:type", User_1.User)
], MaintenanceTicket.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketPriority,
        default: TicketPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.OPEN,
    }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], MaintenanceTicket.prototype, "reported_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], MaintenanceTicket.prototype, "resolved_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "assigned_to", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", User_1.User)
], MaintenanceTicket.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "resolution_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "scheduled_maintenance_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ScheduledMaintenance_1.ScheduledMaintenance, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduled_maintenance_id' }),
    __metadata("design:type", ScheduledMaintenance_1.ScheduledMaintenance)
], MaintenanceTicket.prototype, "scheduledMaintenance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScheduledMaintenance_1.InventoryAction,
        nullable: true,
    }),
    __metadata("design:type", String)
], MaintenanceTicket.prototype, "inventory_action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MaintenanceTicket.prototype, "quantity_deducted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MaintenanceTicket.prototype, "inventory_restored", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MaintenanceTicket.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MaintenanceTicket.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaintenanceTicket.prototype, "generateId", null);
exports.MaintenanceTicket = MaintenanceTicket = __decorate([
    (0, typeorm_1.Entity)('maintenance_tickets')
], MaintenanceTicket);
//# sourceMappingURL=MaintenanceTicket.js.map