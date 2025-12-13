import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity('research_projects')
export class ResearchProject {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 20 })
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';

  @Column('datetime')
  startDate: Date;

  @Column('datetime', { nullable: true })
  endDate: Date;

  @Column('varchar', { length: 36 })
  leadResearcherId: string;

  @Column('simple-array', { nullable: true })
  teamMembers: string[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualSpend: number;

  @Column('text', { nullable: true })
  findings: string;

  @Column('varchar', { length: 50, nullable: true })
  researchCode: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  plannedHours: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalHoursLogged: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  lastUpdated: Date;
}
