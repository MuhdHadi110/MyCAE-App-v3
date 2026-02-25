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
exports.ReceivedInvoice = exports.ReceivedInvoiceStatus = void 0;
const typeorm_1 = require("typeorm");
const IssuedPO_1 = require("./IssuedPO");
const User_1 = require("./User");
const Company_1 = require("./Company");
var ReceivedInvoiceStatus;
(function (ReceivedInvoiceStatus) {
    ReceivedInvoiceStatus["PENDING"] = "pending";
    ReceivedInvoiceStatus["VERIFIED"] = "verified";
    ReceivedInvoiceStatus["PAID"] = "paid";
    ReceivedInvoiceStatus["DISPUTED"] = "disputed";
})(ReceivedInvoiceStatus || (exports.ReceivedInvoiceStatus = ReceivedInvoiceStatus = {}));
let ReceivedInvoice = class ReceivedInvoice {
};
exports.ReceivedInvoice = ReceivedInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_number', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issued_po_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "issuedPoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_name', type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "vendorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], ReceivedInvoice.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'MYR' }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_myr', type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "amountMyr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exchange_rate', type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "exchangeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_date', type: 'datetime' }),
    __metadata("design:type", Date)
], ReceivedInvoice.prototype, "invoiceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_date', type: 'datetime' }),
    __metadata("design:type", Date)
], ReceivedInvoice.prototype, "receivedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReceivedInvoiceStatus,
        default: ReceivedInvoiceStatus.PENDING,
    }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_by', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ReceivedInvoice.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReceivedInvoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ReceivedInvoice.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => IssuedPO_1.IssuedPO, (issuedPO) => issuedPO.receivedInvoices),
    (0, typeorm_1.JoinColumn)({ name: 'issued_po_id' }),
    __metadata("design:type", IssuedPO_1.IssuedPO)
], ReceivedInvoice.prototype, "issuedPO", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", User_1.User)
], ReceivedInvoice.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'verified_by' }),
    __metadata("design:type", User_1.User)
], ReceivedInvoice.prototype, "verifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ReceivedInvoice.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], ReceivedInvoice.prototype, "company", void 0);
exports.ReceivedInvoice = ReceivedInvoice = __decorate([
    (0, typeorm_1.Entity)('received_invoices')
], ReceivedInvoice);
//# sourceMappingURL=ReceivedInvoice.js.map