import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Migration to add performance indexes on frequently queried columns
 * This improves query performance for common operations
 */
export class AddPerformanceIndexes1735200000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1735200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Purchase Orders indexes
    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'IDX_purchase_orders_project_code',
        columnNames: ['project_code'],
      })
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'IDX_purchase_orders_is_active',
        columnNames: ['is_active'],
      })
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'IDX_purchase_orders_created_at',
        columnNames: ['created_at'],
      })
    );

    // Invoices indexes
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_project_code',
        columnNames: ['project_code'],
      })
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_invoice_date',
        columnNames: ['invoice_date'],
      })
    );

    // Timesheets indexes
    await queryRunner.createIndex(
      'timesheets',
      new TableIndex({
        name: 'IDX_timesheets_project_id',
        columnNames: ['project_id'],
      })
    );

    await queryRunner.createIndex(
      'timesheets',
      new TableIndex({
        name: 'IDX_timesheets_engineer_id',
        columnNames: ['engineer_id'],
      })
    );

    await queryRunner.createIndex(
      'timesheets',
      new TableIndex({
        name: 'IDX_timesheets_date',
        columnNames: ['date'],
      })
    );

    // Projects indexes
    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_manager_id',
        columnNames: ['manager_id'],
      })
    );

    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_lead_engineer_id',
        columnNames: ['lead_engineer_id'],
      })
    );

    // Team Members indexes
    await queryRunner.createIndex(
      'team_members',
      new TableIndex({
        name: 'IDX_team_members_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'team_members',
      new TableIndex({
        name: 'IDX_team_members_is_active',
        columnNames: ['is_active'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.dropIndex('team_members', 'IDX_team_members_is_active');
    await queryRunner.dropIndex('team_members', 'IDX_team_members_user_id');

    await queryRunner.dropIndex('projects', 'IDX_projects_lead_engineer_id');
    await queryRunner.dropIndex('projects', 'IDX_projects_manager_id');
    await queryRunner.dropIndex('projects', 'IDX_projects_status');

    await queryRunner.dropIndex('timesheets', 'IDX_timesheets_date');
    await queryRunner.dropIndex('timesheets', 'IDX_timesheets_engineer_id');
    await queryRunner.dropIndex('timesheets', 'IDX_timesheets_project_id');

    await queryRunner.dropIndex('invoices', 'IDX_invoices_invoice_date');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_status');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_project_code');

    await queryRunner.dropIndex('purchase_orders', 'IDX_purchase_orders_created_at');
    await queryRunner.dropIndex('purchase_orders', 'IDX_purchase_orders_is_active');
    await queryRunner.dropIndex('purchase_orders', 'IDX_purchase_orders_project_code');
  }
}
