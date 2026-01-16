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
import { Contact } from './Contact';
import { Client } from './Client';

export enum ProjectStatus {
  PRE_LIM = 'pre-lim',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  project_code: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 36 })
  client_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  contact_id?: string;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PRE_LIM,
  })
  status: ProjectStatus;

  @Column({ type: 'datetime', nullable: true })
  inquiry_date?: Date;

  @Column({ type: 'datetime', nullable: true })
  po_received_date?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  po_file_url?: string;

  @Column({ type: 'datetime', nullable: true })
  completion_date?: Date;

  @Column({ type: 'datetime', nullable: true })
  invoiced_date?: Date;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'int' })
  planned_hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  daily_rate: number | null;

  @Column({ type: 'int', default: 0 })
  actual_hours: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  lead_engineer_id?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'lead_engineer_id' })
  lead_engineer?: User;

  @Column({ type: 'varchar', length: 36 })
  manager_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'json', nullable: true })
  categories?: string[];

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
