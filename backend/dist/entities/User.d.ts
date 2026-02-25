export declare enum UserRole {
    ENGINEER = "engineer",
    SENIOR_ENGINEER = "senior-engineer",
    PRINCIPAL_ENGINEER = "principal-engineer",
    MANAGER = "manager",
    MANAGING_DIRECTOR = "managing-director",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    roleValue: string;
    /**
     * Get all roles as an array
     */
    get roles(): UserRole[];
    /**
     * Set roles as an array
     */
    set roles(value: UserRole[]);
    /**
     * Get the primary role (first role in the array for backward compatibility)
     */
    get role(): UserRole;
    /**
     * Set the primary role (converts to single-element array)
     */
    set role(value: UserRole);
    department?: string;
    position?: string;
    avatar?: string;
    reset_token?: string;
    reset_token_expires?: Date;
    temp_password_expires?: Date;
    is_temp_password: boolean;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
    /**
     * Check if user has a specific role
     */
    hasRole(roleToCheck: UserRole): boolean;
    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(rolesToCheck: UserRole[]): boolean;
    /**
     * Get the hierarchy level of the highest role
     * Hierarchy: Engineer(1) < Senior Engineer(2) < Principal Engineer(3) < Manager(3) < Managing Director(4) < Admin(5)
     */
    getRoleLevel(): number;
}
//# sourceMappingURL=User.d.ts.map