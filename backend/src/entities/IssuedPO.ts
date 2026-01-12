import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

export enum IssuedPOStatus {
  ISSUED = 'issued',
  RECEIVED = 'received',
  COMPLETED = 'completed',
}

@Entity('issued_pos')
export class IssuedPO {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  po_number: string;

  @Column({ type: 'text' })
  items: string;

  @Column({ type: 'varchar', length: 200 })
  recipient: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  project_code: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  currency: string; // Original currency (SGD, USD, MYR, etc.)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_myr: number; // Converted amount in MYR (auto-calculated)

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchange_rate: number; // Exchange rate used for conversion (snapshot)

  @Column({ type: 'datetime' })
  issue_date: Date;

  @Column({ type: 'datetime', nullable: true })
  due_date?: Date;

  @Column({
    type: 'enum',
    enum: IssuedPOStatus,
    default: IssuedPOStatus.ISSUED,
  })
  status: IssuedPOStatus;

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
