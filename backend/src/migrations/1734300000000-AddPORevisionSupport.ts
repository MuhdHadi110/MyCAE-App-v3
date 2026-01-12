import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class AddPORevisionSupport1734300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns for revision tracking
    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'revision_number',
      type: 'int',
      default: 1,
      isNullable: false,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'is_active',
      type: 'boolean',
      default: true,
      isNullable: false,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'superseded_by',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'supersedes',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'revision_date',
      type: 'datetime',
      isNullable: false,
      default: 'CURRENT_TIMESTAMP',
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'revision_reason',
      type: 'text',
      isNullable: true,
    }));

    // 2. Add new columns for MYR adjustment
    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'amount_myr_adjusted',
      type: 'decimal',
      precision: 15,
      scale: 2,
      isNullable: true,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'adjustment_reason',
      type: 'text',
      isNullable: true,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'adjusted_by',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'adjusted_at',
      type: 'datetime',
      isNullable: true,
    }));

    // 3. Add po_number_base column
    await queryRunner.addColumn('purchase_orders', new TableColumn({
      name: 'po_number_base',
      type: 'varchar',
      length: '100',
      isNullable: false,
      default: "''",
    }));

    // 4. Backfill existing data
    await queryRunner.query(`
      UPDATE purchase_orders
      SET po_number_base = po_number,
          revision_number = 1,
          is_active = 1,
          revision_date = created_at
      WHERE po_number_base = '' OR po_number_base IS NULL
    `);

    // 5. Create indices for better query performance
    await queryRunner.createIndex('purchase_orders', new TableIndex({
      name: 'IDX_po_number_base',
      columnNames: ['po_number_base'],
    }));

    await queryRunner.createIndex('purchase_orders', new TableIndex({
      name: 'IDX_is_active',
      columnNames: ['is_active'],
    }));

    await queryRunner.createIndex('purchase_orders', new TableIndex({
      name: 'IDX_po_base_active_rev',
      columnNames: ['po_number_base', 'is_active', 'revision_number'],
    }));

    // 6. Add foreign keys for revision chain (self-referential)
    await queryRunner.createForeignKey('purchase_orders', new TableForeignKey({
      name: 'FK_po_superseded_by',
      columnNames: ['superseded_by'],
      referencedTableName: 'purchase_orders',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('purchase_orders', new TableForeignKey({
      name: 'FK_po_supersedes',
      columnNames: ['supersedes'],
      referencedTableName: 'purchase_orders',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    // 7. Add foreign key to users for adjustment tracking
    await queryRunner.createForeignKey('purchase_orders', new TableForeignKey({
      name: 'FK_po_adjusted_by',
      columnNames: ['adjusted_by'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('purchase_orders', 'FK_po_adjusted_by');
    await queryRunner.dropForeignKey('purchase_orders', 'FK_po_supersedes');
    await queryRunner.dropForeignKey('purchase_orders', 'FK_po_superseded_by');

    // Drop indices
    await queryRunner.dropIndex('purchase_orders', 'IDX_po_base_active_rev');
    await queryRunner.dropIndex('purchase_orders', 'IDX_is_active');
    await queryRunner.dropIndex('purchase_orders', 'IDX_po_number_base');

    // Drop columns (in reverse order)
    await queryRunner.dropColumn('purchase_orders', 'po_number_base');
    await queryRunner.dropColumn('purchase_orders', 'adjusted_at');
    await queryRunner.dropColumn('purchase_orders', 'adjusted_by');
    await queryRunner.dropColumn('purchase_orders', 'adjustment_reason');
    await queryRunner.dropColumn('purchase_orders', 'amount_myr_adjusted');
    await queryRunner.dropColumn('purchase_orders', 'revision_reason');
    await queryRunner.dropColumn('purchase_orders', 'revision_date');
    await queryRunner.dropColumn('purchase_orders', 'supersedes');
    await queryRunner.dropColumn('purchase_orders', 'superseded_by');
    await queryRunner.dropColumn('purchase_orders', 'is_active');
    await queryRunner.dropColumn('purchase_orders', 'revision_number');
  }
}
