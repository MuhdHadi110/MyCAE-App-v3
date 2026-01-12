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
import { InventoryItem } from './InventoryItem';
import { User } from './User';

export enum MaintenanceType {
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  SERVICING = 'servicing',
  REPLACEMENT = 'replacement',
  OTHER = 'other',
}

export enum InventoryAction {
  DEDUCT = 'deduct',
  STATUS_ONLY = 'status-only',
  NONE = 'none',
}

@Entity('scheduled_maintenance')
export class ScheduledMaintenance {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  item_id: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.OTHER,
  })
  maintenance_type: MaintenanceType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  scheduled_date: Date;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'date', nullable: true })
  completed_date?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  completed_by?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completedByUser?: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  ticket_id?: string;

  @Column({ type: 'boolean', default: false })
  reminder_14_sent: boolean;

  @Column({ type: 'boolean', default: false })
  reminder_7_sent: boolean;

  @Column({ type: 'boolean', default: false })
  reminder_1_sent: boolean;

  @Column({
    type: 'enum',
    enum: InventoryAction,
    default: InventoryAction.NONE,
  })
  inventory_action: InventoryAction;

  @Column({ type: 'int', default: 1 })
  quantity_affected: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

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
