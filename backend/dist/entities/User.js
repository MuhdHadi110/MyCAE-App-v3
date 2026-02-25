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
exports.User = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
var UserRole;
(function (UserRole) {
    UserRole["ENGINEER"] = "engineer";
    UserRole["SENIOR_ENGINEER"] = "senior-engineer";
    UserRole["PRINCIPAL_ENGINEER"] = "principal-engineer";
    UserRole["MANAGER"] = "manager";
    UserRole["MANAGING_DIRECTOR"] = "managing-director";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
let User = class User {
    /**
     * Get all roles as an array
     */
    get roles() {
        try {
            // If roleValue is a JSON array string
            if (this.roleValue && this.roleValue.startsWith('[')) {
                return JSON.parse(this.roleValue);
            }
            // Fallback: if it's a single role string (legacy data)
            if (this.roleValue) {
                return [this.roleValue];
            }
            return [UserRole.ENGINEER];
        }
        catch {
            return [UserRole.ENGINEER];
        }
    }
    /**
     * Set roles as an array
     */
    set roles(value) {
        this.roleValue = JSON.stringify(value);
    }
    /**
     * Get the primary role (first role in the array for backward compatibility)
     */
    get role() {
        const rolesArray = this.roles;
        return rolesArray[0] || UserRole.ENGINEER;
    }
    /**
     * Set the primary role (converts to single-element array)
     */
    set role(value) {
        this.roles = [value];
    }
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
    /**
     * Check if user has a specific role
     */
    hasRole(roleToCheck) {
        return this.roles.includes(roleToCheck);
    }
    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(rolesToCheck) {
        return this.roles.some(role => rolesToCheck.includes(role));
    }
    /**
     * Get the hierarchy level of the highest role
     * Hierarchy: Engineer(1) < Senior Engineer(2) < Principal Engineer(3) < Manager(3) < Managing Director(4) < Admin(5)
     */
    getRoleLevel() {
        const roleHierarchy = {
            [UserRole.ADMIN]: 5,
            [UserRole.MANAGING_DIRECTOR]: 4,
            [UserRole.MANAGER]: 3,
            [UserRole.PRINCIPAL_ENGINEER]: 3,
            [UserRole.SENIOR_ENGINEER]: 2,
            [UserRole.ENGINEER]: 1,
        };
        // Return the highest level among all roles
        return Math.max(...this.roles.map(role => roleHierarchy[role] || 1));
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'roles',
        type: 'varchar',
        length: 255,
        default: '["engineer"]',
        nullable: false,
    }),
    __metadata("design:type", String)
], User.prototype, "roleValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "reset_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "reset_token_expires", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "temp_password_expires", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "is_temp_password", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "generateId", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=User.js.map