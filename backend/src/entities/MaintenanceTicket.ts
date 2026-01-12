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
import { InventoryItem } from './InventoryItem';
import { ScheduledMaintenance, InventoryAction } from './ScheduledMaintenance';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('maintenance_tickets')
export class MaintenanceTicket {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  item_id: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ type: 'varchar', length: 36 })
  reported_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reporter: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ type: 'datetime' })
  reported_date: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_date?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assigned_to?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  // Link to scheduled maintenance (if created from schedule)
  @Column({ type: 'varchar', length: 36, nullable: true })
  scheduled_maintenance_id?: string;

  @ManyToOne(() => ScheduledMaintenance, { nullable: true })
  @JoinColumn({ name: 'scheduled_maintenance_id' })
  scheduledMaintenance?: ScheduledMaintenance;

  // Inventory impact tracking
  @Column({
    type: 'enum',
    enum: InventoryAction,
    nullable: true,
  })
  inventory_action?: InventoryAction;

  @Column({ type: 'int', default: 0 })
  quantity_deducted: number;

  @Column({ type: 'boolean', default: false })
  inventory_restored: boolean;

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
