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
import { InventoryItem } from './InventoryItem';

export enum CheckoutStatus {
  CHECKED_OUT = 'checked-out',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  PARTIAL_RETURN = 'partial-return',
}

@Entity('checkouts')
export class Checkout {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  masterBarcode: string;

  @Column({ type: 'varchar', length: 36 })
  item_id: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  returned_quantity: number;

  @Column({ type: 'datetime' })
  checkout_date: Date;

  @Column({ type: 'datetime', nullable: true })
  expected_return_date?: Date;

  @Column({ type: 'datetime', nullable: true })
  actual_return_date?: Date;

  @Column({
    type: 'enum',
    enum: CheckoutStatus,
    default: CheckoutStatus.CHECKED_OUT,
  })
  status: CheckoutStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purpose?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition?: string;

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
