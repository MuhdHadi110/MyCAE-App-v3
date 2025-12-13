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

export enum ComputerType {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  WORKSTATION = 'workstation',
}

export enum ComputerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_REPAIR = 'in-repair',
  DECOMMISSIONED = 'decommissioned',
}

@Entity('computers')
export class Computer {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  asset_tag: string;

  @Column({ type: 'varchar', length: 255 })
  device_name: string;

  @Column({
    type: 'enum',
    enum: ComputerType,
    default: ComputerType.LAPTOP,
  })
  computer_type: ComputerType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_number?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assigned_to?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processor?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ram?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  storage?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  graphics?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os_version?: string;

  @Column({
    type: 'enum',
    enum: ComputerStatus,
    default: ComputerStatus.ACTIVE,
  })
  status: ComputerStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchase_cost?: number;

  @Column({ type: 'datetime', nullable: true })
  purchase_date?: Date;

  @Column({ type: 'datetime', nullable: true })
  warranty_expiry?: Date;

  @Column({ type: 'datetime', nullable: true })
  decommission_date?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  installed_software?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

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
