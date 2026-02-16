import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  ENGINEER = 'engineer',
  SENIOR_ENGINEER = 'senior-engineer',
  PRINCIPAL_ENGINEER = 'principal-engineer',
  MANAGER = 'manager',
  MANAGING_DIRECTOR = 'managing-director',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    name: 'roles',
    type: 'varchar',
    length: 255,
    default: '["engineer"]',
    nullable: false,
  })
  roleValue: string;

  /**
   * Get all roles as an array
   */
  get roles(): UserRole[] {
    try {
      // If roleValue is a JSON array string
      if (this.roleValue && this.roleValue.startsWith('[')) {
        return JSON.parse(this.roleValue) as UserRole[];
      }
      // Fallback: if it's a single role string (legacy data)
      if (this.roleValue) {
        return [this.roleValue as UserRole];
      }
      return [UserRole.ENGINEER];
    } catch {
      return [UserRole.ENGINEER];
    }
  }

  /**
   * Set roles as an array
   */
  set roles(value: UserRole[]) {
    this.roleValue = JSON.stringify(value);
  }

  /**
   * Get the primary role (first role in the array for backward compatibility)
   */
  get role(): UserRole {
    const rolesArray = this.roles;
    return rolesArray[0] || UserRole.ENGINEER;
  }

  /**
   * Set the primary role (converts to single-element array)
   */
  set role(value: UserRole) {
    this.roles = [value];
  }

  @Column({ type: 'varchar', length: 255, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expires?: Date;

  @Column({ type: 'timestamp', nullable: true })
  temp_password_expires?: Date;

  @Column({ type: 'boolean', default: false })
  is_temp_password: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleToCheck: UserRole): boolean {
    return this.roles.includes(roleToCheck);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(rolesToCheck: UserRole[]): boolean {
    return this.roles.some(role => rolesToCheck.includes(role));
  }

  /**
   * Get the hierarchy level of the highest role
   * Hierarchy: Engineer(1) < Senior Engineer(2) < Principal Engineer(3) < Manager(3) < Managing Director(4) < Admin(5)
   */
  getRoleLevel(): number {
    const roleHierarchy: Record<UserRole, number> = {
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
}
