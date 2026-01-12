import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { User } from './User';
import { v4 as uuidv4 } from 'uuid';

@Entity('research_projects')
export class ResearchProject {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { name: 'research_code', length: 100, nullable: true })
  researchCode: string | null;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('varchar', { name: 'lead_researcher_id', length: 36, nullable: true })
  leadResearcherId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lead_researcher_id' })
  leadResearcher: User;

  @Column({
    type: 'enum',
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'archived'],
    default: 'planning'
  })
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'archived';

  @Column('datetime', { name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column('datetime', { name: 'planned_end_date', nullable: true })
  plannedEndDate: Date | null;

  @Column('datetime', { name: 'actual_end_date', nullable: true })
  actualEndDate: Date | null;

  @Column('varchar', { length: 255, nullable: true })
  budget: string | null;

  @Column('varchar', { name: 'funding_source', length: 255, nullable: true })
  fundingSource: string | null;

  @Column('varchar', { length: 255, nullable: true })
  category: string | null;

  @Column('text', { nullable: true })
  objectives: string | null;

  @Column('text', { nullable: true })
  methodology: string | null;

  @Column('text', { nullable: true })
  findings: string | null;

  @Column('text', { nullable: true })
  publications: string | null;

  @Column('text', { name: 'team_members', nullable: true })
  teamMembers: string | null;

  @Column('text', { nullable: true })
  collaborators: string | null;

  @Column('text', { name: 'equipment_used', nullable: true })
  equipmentUsed: string | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
