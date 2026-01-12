import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';

export enum ActivityType {
  INVENTORY_CREATE = 'inventory-create',
  INVENTORY_UPDATE = 'inventory-update',
  INVENTORY_DELETE = 'inventory-delete',
  CHECKOUT_CREATE = 'checkout-create',
  CHECKOUT_RETURN = 'checkout-return',
  PROJECT_CREATE = 'project-create',
  PROJECT_UPDATE = 'project-update',
  PROJECT_STATUS_CHANGE = 'project-status-change',
  TIMESHEET_CREATE = 'timesheet-create',
  MAINTENANCE_CREATE = 'maintenance-create',
  MAINTENANCE_UPDATE = 'maintenance-update',
  USER_LOGIN = 'user-login',
  USER_CREATE = 'user-create',
  BULK_IMPORT = 'bulk-import',
  INVOICE_CREATE = 'invoice-create',
  INVOICE_UPDATE = 'invoice-update',
  INVOICE_STATUS_CHANGE = 'invoice-status-change',
  INVOICE_AMOUNT_CHANGE = 'invoice-amount-change',
}

@Entity('activities')
export class Activity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_type?: string; // 'inventory', 'checkout', 'project', 'timesheet', etc.

  @Column({ type: 'varchar', length: 36, nullable: true })
  entity_id?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module?: string; // 'inventory', 'checkout', 'project', 'maintenance', etc.

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
}
