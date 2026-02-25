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
exports.InventoryItem = exports.InventoryLastAction = exports.InventoryStatus = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["AVAILABLE"] = "available";
    InventoryStatus["LOW_STOCK"] = "low-stock";
    InventoryStatus["OUT_OF_STOCK"] = "out-of-stock";
    InventoryStatus["IN_MAINTENANCE"] = "in-maintenance";
    InventoryStatus["DISCONTINUED"] = "discontinued";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var InventoryLastAction;
(function (InventoryLastAction) {
    InventoryLastAction["ADDED"] = "added";
    InventoryLastAction["RETURNED"] = "returned";
    InventoryLastAction["CHECKED_OUT"] = "checked-out";
    InventoryLastAction["UPDATED"] = "updated";
})(InventoryLastAction || (exports.InventoryLastAction = InventoryLastAction = {}));
let InventoryItem = class InventoryItem {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
    updateStatus() {
        if (this.quantity === 0) {
            this.status = InventoryStatus.OUT_OF_STOCK;
        }
        else if (this.quantity <= this.minimumStock) {
            this.status = InventoryStatus.LOW_STOCK;
        }
        else {
            this.status = InventoryStatus.AVAILABLE;
        }
    }
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "minimumStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "unitOfMeasure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryStatus,
        default: InventoryStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], InventoryItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "imageURL", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "next_maintenance_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "last_calibrated_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "in_maintenance_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryLastAction,
        default: InventoryLastAction.ADDED,
    }),
    __metadata("design:type", String)
], InventoryItem.prototype, "last_action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "last_action_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "last_action_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryItem.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryItem.prototype, "updateStatus", null);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)('inventory')
], InventoryItem);
//# sourceMappingURL=InventoryItem.js.map