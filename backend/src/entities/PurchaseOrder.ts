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

  @Column({ type: 'varchar', length: 100, unique: true })
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
