import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Project } from './Project';
import { TeamMember } from './TeamMember';

export enum ProjectTeamRole {
  LEAD_ENGINEER = 'lead_engineer',
  ENGINEER = 'engineer',
}

@Entity('project_team_members')
export class ProjectTeamMember {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  project_id: string;

  @ManyToOne(() => Project, (project) => project.teamMembers)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 36 })
  team_member_id: string;

  @ManyToOne(() => TeamMember)
  @JoinColumn({ name: 'team_member_id' })
  teamMember: TeamMember;

  @Column({
    type: 'enum',
    enum: ProjectTeamRole,
    default: ProjectTeamRole.ENGINEER,
  })
  role: ProjectTeamRole;

  @CreateDateColumn()
  created_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
