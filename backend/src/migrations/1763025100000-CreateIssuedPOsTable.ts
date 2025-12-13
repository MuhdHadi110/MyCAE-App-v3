import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateIssuedPOsTable1763025100000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'issued_pos',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'po_number',
                        type: 'varchar',
                        length: '100',
                        isUnique: true,
                    },
                    {
                        name: 'items',
                        type: 'text',
                    },
                    {
                        name: 'recipient',
                        type: 'varchar',
                        length: '200',
                    },
                    {
                        name: 'project_code',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                    },
                    {
                        name: 'issue_date',
                        type: 'datetime',
                    },
                    {
                        name: 'due_date',
                        type: 'datetime',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['issued', 'received', 'completed'],
                        default: "'issued'",
                    },
                    {
                        name: 'file_url',
                        type: 'varchar',
                        length: '500',
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

        // No FK constraint for project_code as it's optional
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('issued_pos');
    }

}
