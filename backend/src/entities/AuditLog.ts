import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum AuditEntityType {
  INVOICE = 'invoice',
  ISSUED_PO = 'issued_po',
  RECEIVED_PO = 'received_po',
  PROJECT = 'project',
  PAYMENT = 'payment',
  EXCHANGE_RATE = 'exchange_rate',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  entity_type!: AuditEntityType;

  @Column({ type: 'varchar', length: 36 })
  entity_id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  user_id!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_name!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_email!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'json', nullable: true })
  changes!: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
