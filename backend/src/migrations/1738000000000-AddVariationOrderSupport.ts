import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class AddVariationOrderSupport1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add parent_project_id column (self-referential FK)
    await queryRunner.addColumn('projects', new TableColumn({
      name: 'parent_project_id',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    // 2. Add is_variation_order flag for easy filtering
    await queryRunner.addColumn('projects', new TableColumn({
      name: 'is_variation_order',
      type: 'boolean',
      default: false,
      isNullable: false,
    }));

    // 3. Add vo_number for tracking sequence (1, 2, 3, etc.)
    await queryRunner.addColumn('projects', new TableColumn({
      name: 'vo_number',
      type: 'int',
      isNullable: true,
    }));

    // 4. Create index for parent lookups
    await queryRunner.createIndex('projects', new TableIndex({
      name: 'IDX_parent_project_id',
      columnNames: ['parent_project_id'],
    }));

    // 5. Create composite index for VO queries
    await queryRunner.createIndex('projects', new TableIndex({
      name: 'IDX_parent_vo',
      columnNames: ['parent_project_id', 'is_variation_order', 'vo_number'],
    }));

    // 6. Add self-referential foreign key
    await queryRunner.createForeignKey('projects', new TableForeignKey({
      name: 'FK_project_parent',
      columnNames: ['parent_project_id'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT', // Prevent deleting parent if VOs exist
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.dropForeignKey('projects', 'FK_project_parent');
    await queryRunner.dropIndex('projects', 'IDX_parent_vo');
    await queryRunner.dropIndex('projects', 'IDX_parent_project_id');
    await queryRunner.dropColumn('projects', 'vo_number');
    await queryRunner.dropColumn('projects', 'is_variation_order');
    await queryRunner.dropColumn('projects', 'parent_project_id');
  }
}
