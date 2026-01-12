import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  company_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registration_number: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sst_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 7, default: '#2563eb' })
  primary_color: string;

  @Column({ type: 'text', nullable: true })
  invoice_footer: string;

  @Column({ type: 'text', nullable: true })
  po_footer: string;

  @Column({ type: 'text', nullable: true })
  bank_details: string;

  // PDF Layout options
  @Column({ type: 'varchar', length: 20, default: 'top-center' })
  header_position: string;

  @Column({ type: 'varchar', length: 10, default: 'medium' })
  logo_size: string;

  @Column({ type: 'boolean', default: true })
  show_sst_id: boolean;

  @Column({ type: 'boolean', default: true })
  show_bank_details: boolean;

  @Column({ type: 'int', default: 50 })
  page_margin: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
