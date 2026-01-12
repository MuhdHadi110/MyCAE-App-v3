import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 3 })
  fromCurrency: string; // e.g., 'SGD', 'USD', 'EUR'

  @Column({ type: 'varchar', length: 3, default: 'MYR' })
  toCurrency: string; // Always MYR for this use case

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  rate: number; // e.g., 1 SGD = 3.45 MYR

  @Column({ type: 'date' })
  effectiveDate: Date; // Date this rate is effective from

  @Column({ type: 'enum', enum: ['manual', 'api'], default: 'manual' })
  source: 'manual' | 'api'; // How rate was obtained

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
