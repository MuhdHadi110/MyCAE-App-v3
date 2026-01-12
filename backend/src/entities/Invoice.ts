import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';
import { User } from './User';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending-approval',
  APPROVED = 'approved',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  invoice_number: string;

  @Column({ type: 'varchar', length: 100 })
  project_code: string;

  @Column({ type: 'varchar', length: 500 })
  project_name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  currency: string; // Original currency (SGD, USD, MYR, etc.)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_myr: number; // Converted amount in MYR (auto-calculated)

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchange_rate: number; // Exchange rate used for conversion (snapshot)

  @Column({ type: 'datetime' })
  invoice_date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage_of_total: number;

  @Column({ type: 'int' })
  invoice_sequence: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  cumulative_percentage: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  approved_by: string;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date;

  @Column({ type: 'datetime', nullable: true })
  submitted_for_approval_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_code', referencedColumnName: 'project_code' })
  project: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User;
}
