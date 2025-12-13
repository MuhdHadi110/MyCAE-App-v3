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
import { Project } from './Project';

export enum WorkCategory {
  ENGINEERING = 'engineering',
  PROJECT_MANAGEMENT = 'project-management',
  MEASUREMENT_SITE = 'measurement-site',
  MEASUREMENT_OFFICE = 'measurement-office',
}

@Entity('timesheets')
export class Timesheet {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  project_id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 36 })
  engineer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'engineer_id' })
  engineer: User;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hours: number;

  @Column({
    type: 'enum',
    enum: WorkCategory,
  })
  work_category: WorkCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

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
