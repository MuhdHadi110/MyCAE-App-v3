import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migration to add Structure Container support
 * This allows projects to be divided into multiple structures with separate POs
 * while maintaining backward compatibility with existing Variation Orders
 */
export class AddStructureContainerSupport1770900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add project_type enum column
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'project_type',
        type: 'enum',
        enum: ['standard', 'variation_order', 'structure_container', 'structure_child'],
        default: "'standard'",
        isNullable: true, // Start as nullable for backfill
      })
    );

    // 2. Backfill existing data
    // Variation orders → 'variation_order'
    await queryRunner.query(`
      UPDATE projects 
      SET project_type = 'variation_order' 
      WHERE is_variation_order = true
    `);

    // Regular projects → 'standard'
    await queryRunner.query(`
      UPDATE projects 
      SET project_type = 'standard' 
      WHERE is_variation_order = false OR is_variation_order IS NULL
    `);

    // 3. Make project_type NOT NULL after backfill
    await queryRunner.changeColumn(
      'projects',
      'project_type',
      new TableColumn({
        name: 'project_type',
        type: 'enum',
        enum: ['standard', 'variation_order', 'structure_container', 'structure_child'],
        default: "'standard'",
        isNullable: false,
      })
    );

    // 4. Add index on project_type for performance
    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_type',
        columnNames: ['project_type'],
      })
    );

    // 5. Add composite index for structure queries
    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_parent_type',
        columnNames: ['parent_project_id', 'project_type'],
      })
    );

    console.log('✅ Structure Container support added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.dropIndex('projects', 'IDX_projects_parent_type');
    await queryRunner.dropIndex('projects', 'IDX_projects_type');

    // Remove project_type column
    await queryRunner.dropColumn('projects', 'project_type');

    console.log('⏪ Structure Container support removed');
  }
}
