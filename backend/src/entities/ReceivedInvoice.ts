import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IssuedPO } from './IssuedPO';
import { User } from './User';
import { Company } from './Company';

export enum ReceivedInvoiceStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

@Entity('received_invoices')
export class ReceivedInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100 })
  invoiceNumber: string;

  @Column({ name: 'issued_po_id', type: 'varchar', length: 36 })
  issuedPoId: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200 })
  vendorName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  currency: string;

  @Column({ name: 'amount_myr', type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountMyr: number | null;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchangeRate: number | null;

  @Column({ name: 'invoice_date', type: 'datetime' })
  invoiceDate: Date;

  @Column({ name: 'received_date', type: 'datetime' })
  receivedDate: Date;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ReceivedInvoiceStatus,
    default: ReceivedInvoiceStatus.PENDING,
  })
  status: ReceivedInvoiceStatus;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  fileUrl: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @Column({ name: 'verified_by', type: 'varchar', length: 36, nullable: true })
  verifiedBy: string | null;

  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => IssuedPO, (issuedPO) => issuedPO.receivedInvoices)
  @JoinColumn({ name: 'issued_po_id' })
  issuedPO: IssuedPO;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier: User;

  @Column({ name: 'company_id', type: 'varchar', length: 36, nullable: true })
  companyId: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
