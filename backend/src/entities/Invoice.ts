import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

export enum InvoiceStatus {
  DRAFT = 'draft',
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_code', referencedColumnName: 'project_code' })
  project: Project;
}
