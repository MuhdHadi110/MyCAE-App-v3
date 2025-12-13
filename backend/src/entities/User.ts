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
    default: 'engineer',
    nullable: false,
  })
  roleValue: string;

  /**
   * Get the primary role
   */
  get role(): UserRole {
    return (this.roleValue as UserRole) || UserRole.ENGINEER;
  }

  /**
   * Set the primary role
   */
  set role(value: UserRole) {
    this.roleValue = value;
  }

  @Column({ type: 'varchar', length: 255, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

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
    return this.role === roleToCheck;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(rolesToCheck: UserRole[]): boolean {
    return rolesToCheck.includes(this.role);
  }

  /**
   * Get the hierarchy level of the current role
   * Hierarchy: Engineer(1) < Senior Engineer(2) = Principal Engineer(2) = Manager(2) < Managing Director(3) < Admin(4)
   */
  getRoleLevel(): number {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 4,
      [UserRole.MANAGING_DIRECTOR]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.PRINCIPAL_ENGINEER]: 2,
      [UserRole.SENIOR_ENGINEER]: 2,
      [UserRole.ENGINEER]: 1,
    };
    return roleHierarchy[this.role] || 1;
  }
}
