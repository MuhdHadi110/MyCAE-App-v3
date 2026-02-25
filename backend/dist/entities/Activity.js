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
exports.Activity = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const User_1 = require("./User");
var ActivityType;
(function (ActivityType) {
    ActivityType["INVENTORY_CREATE"] = "inventory-create";
    ActivityType["INVENTORY_UPDATE"] = "inventory-update";
    ActivityType["INVENTORY_DELETE"] = "inventory-delete";
    ActivityType["CHECKOUT_CREATE"] = "checkout-create";
    ActivityType["CHECKOUT_RETURN"] = "checkout-return";
    ActivityType["PROJECT_CREATE"] = "project-create";
    ActivityType["PROJECT_UPDATE"] = "project-update";
    ActivityType["PROJECT_STATUS_CHANGE"] = "project-status-change";
    ActivityType["TIMESHEET_CREATE"] = "timesheet-create";
    ActivityType["MAINTENANCE_CREATE"] = "maintenance-create";
    ActivityType["MAINTENANCE_UPDATE"] = "maintenance-update";
    ActivityType["USER_LOGIN"] = "user-login";
    ActivityType["USER_CREATE"] = "user-create";
    ActivityType["BULK_IMPORT"] = "bulk-import";
    ActivityType["INVOICE_CREATE"] = "invoice-create";
    ActivityType["INVOICE_UPDATE"] = "invoice-update";
    ActivityType["INVOICE_STATUS_CHANGE"] = "invoice-status-change";
    ActivityType["INVOICE_AMOUNT_CHANGE"] = "invoice-amount-change";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
let Activity = class Activity {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.Activity = Activity;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], Activity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ActivityType,
    }),
    __metadata("design:type", String)
], Activity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Activity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Activity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Activity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Activity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Activity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Activity.prototype, "generateId", null);
exports.Activity = Activity = __decorate([
    (0, typeorm_1.Entity)('activities')
], Activity);
//# sourceMappingURL=Activity.js.map