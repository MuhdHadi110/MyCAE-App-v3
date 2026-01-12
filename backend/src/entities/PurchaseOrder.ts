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
import { Project } from './Project';
import { User } from './User';

export enum POStatus {
  RECEIVED = 'received',
  IN_PROGRESS = 'in-progress',
  INVOICED = 'invoiced',
  PAID = 'paid',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  po_number: string;

  @Column({ type: 'varchar', length: 50 })
  project_code: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_code', referencedColumnName: 'project_code' })
  project?: Project;

  @Column({ type: 'varchar', length: 500 })
  client_name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  currency: string; // Original currency (SGD, USD, MYR, etc.)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_myr: number; // Converted amount in MYR (auto-calculated)

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchange_rate: number; // Exchange rate used for conversion (snapshot)

  @Column({ type: 'datetime' })
  received_date: Date;

  @Column({ type: 'datetime', nullable: true })
  due_date?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.RECEIVED,
  })
  status: POStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url?: string;

  // Revision tracking fields
  @Column({ type: 'int', default: 1 })
  revision_number: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  superseded_by: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  supersedes: string | null;

  @Column({ type: 'datetime' })
  revision_date: Date;

  @Column({ type: 'text', nullable: true })
  revision_reason: string | null;

  // Manual MYR adjustment fields
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_myr_adjusted: number | null;

  @Column({ type: 'text', nullable: true })
  adjustment_reason: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  adjusted_by: string | null;

  @Column({ type: 'datetime', nullable: true })
  adjusted_at: Date | null;

  // Base PO number (without revision)
  @Column({ type: 'varchar', length: 100 })
  po_number_base: string;

  // Self-referential relations for revision chain
  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'supersedes' })
  previousRevision?: PurchaseOrder;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'superseded_by' })
  nextRevision?: PurchaseOrder;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adjusted_by' })
  adjustedByUser?: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Computed property: Use adjusted amount if present, else calculated amount
  get effective_amount_myr(): number {
    return this.amount_myr_adjusted ?? this.amount_myr;
  }

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    // Set default values for revision fields if not already set
    if (!this.revision_number) {
      this.revision_number = 1;
    }
    if (this.is_active === undefined) {
      this.is_active = true;
    }
    if (!this.revision_date) {
      this.revision_date = new Date();
    }
    if (!this.po_number_base) {
      this.po_number_base = this.po_number;
    }
  }
}
