import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from './Project';
import { TeamMember } from './TeamMember';

@Entity('project_hourly_rates')
@Unique(['projectId', 'teamMemberId'])
export class ProjectHourlyRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column('varchar')
  teamMemberId: string;

  @ManyToOne(() => TeamMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamMemberId' })
  teamMember: TeamMember;

  @Column('decimal', { precision: 10, scale: 2 })
  hourlyRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
