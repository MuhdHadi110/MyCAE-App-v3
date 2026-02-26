import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingColumns1770800000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column to projects table if it doesn't exist
    const projectTable = await queryRunner.getTable('projects');
    const descriptionColumn = projectTable?.findColumnByName('description');
    
    if (!descriptionColumn) {
      await queryRunner.addColumn(
        'projects',
        new TableColumn({
          name: 'description',
          type: 'text',
          isNullable: true,
        })
      );
    }

    // Add last_calibrated_date column to inventory table if it doesn't exist
    const inventoryTable = await queryRunner.getTable('inventory');
    const lastCalibratedColumn = inventoryTable?.findColumnByName('last_calibrated_date');
    
    if (!lastCalibratedColumn) {
      await queryRunner.addColumn(
        'inventory',
        new TableColumn({
          name: 'last_calibrated_date',
          type: 'date',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove description column
    const projectTable = await queryRunner.getTable('projects');
    const descriptionColumn = projectTable?.findColumnByName('description');
    
    if (descriptionColumn) {
      await queryRunner.dropColumn('projects', 'description');
    }

    // Remove last_calibrated_date column
    const inventoryTable = await queryRunner.getTable('inventory');
    const lastCalibratedColumn = inventoryTable?.findColumnByName('last_calibrated_date');
    
    if (lastCalibratedColumn) {
      await queryRunner.dropColumn('inventory', 'last_calibrated_date');
    }
  }
}
