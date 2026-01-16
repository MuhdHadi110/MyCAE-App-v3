import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateReceivedInvoicesTable1736500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.hasTable('received_invoices');
    if (tableExists) {
      console.log('Table received_invoices already exists, skipping creation');
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'received_invoices',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'issued_po_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'vendor_name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'MYR'",
          },
          {
            name: 'amount_myr',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'invoice_date',
            type: 'datetime',
          },
          {
            name: 'received_date',
            type: 'datetime',
          },
          {
            name: 'due_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'verified', 'paid', 'disputed'],
            default: "'pending'",
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'verified_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'verified_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'paid_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key to issued_pos table
    await queryRunner.createForeignKey(
      'received_invoices',
      new TableForeignKey({
        columnNames: ['issued_po_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'issued_pos',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('received_invoices');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('issued_po_id') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('received_invoices', foreignKey);
      }
    }
    await queryRunner.dropTable('received_invoices', true);
  }
}
