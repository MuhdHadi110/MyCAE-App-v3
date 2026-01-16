# MyCAE Tracker Database Migration Analysis

Generated: 2026-01-06T04:12:09.484Z

## Current Database Configuration

- **Host**: localhost
- **Port**: 3306
- **Database**: mycae_tracker
- **User**: root
- **Engine**: MySQL (InnoDB)
- **Charset**: utf8mb4
- **Timezone**: Z (UTC)

## Database Schema Overview

Total Tables: 19

Total Database Size: 1.14 MB
Total Records: 385

| Table Name | Rows | Size (KB) | Engine | Collation | Auto Increment |
|------------|------|-----------|--------|-----------|----------------|
| activities                     | 0      | 32        | InnoDB | utf8mb4_general_ci | N/A |
| checkouts                      | 1      | 48        | InnoDB | utf8mb4_general_ci | N/A |
| clients                        | 0      | 32        | InnoDB | utf8mb4_general_ci | N/A |
| computers                      | 6      | 48        | InnoDB | utf8mb4_general_ci | N/A |
| exchange_rates                 | 260    | 48        | InnoDB | utf8mb4_general_ci | N/A |
| inventory                      | 1      | 32        | InnoDB | utf8mb4_general_ci | N/A |
| invoices                       | 0      | 80        | InnoDB | utf8mb4_general_ci | N/A |
| issued_pos                     | 41     | 32        | InnoDB | utf8mb4_general_ci | N/A |
| maintenance_tickets            | 0      | 64        | InnoDB | utf8mb4_general_ci | N/A |
| migrations                     | 17     | 16        | InnoDB | utf8mb4_general_ci | 20 |
| projects                       | 6      | 112       | InnoDB | utf8mb4_general_ci | N/A |
| project_hourly_rates           | 0      | 64        | InnoDB | utf8mb4_general_ci | N/A |
| purchase_orders                | 3      | 192       | InnoDB | utf8mb4_general_ci | N/A |
| research_projects              | 2      | 48        | InnoDB | utf8mb4_general_ci | N/A |
| research_timesheets            | 2      | 64        | InnoDB | utf8mb4_general_ci | N/A |
| team_members                   | 18     | 48        | InnoDB | utf8mb4_general_ci | N/A |
| timesheets                     | 8      | 96        | InnoDB | utf8mb4_general_ci | N/A |
| token_blacklist                | 0      | 64        | InnoDB | utf8mb4_general_ci | N/A |
| users                          | 20     | 48        | InnoDB | utf8mb4_general_ci | N/A |

## Key Tables Analysis

### users

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| name                 | varchar         | NO       | NULL    |      |            |
| email                | varchar         | NO       | NULL    | UNI  |            |
| password_hash        | varchar         | NO       | NULL    |      |            |
| department           | varchar         | YES      | NULL    |      |            |
| position             | varchar         | YES      | NULL    |      |            |
| avatar               | varchar         | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |
| roles                | varchar         | NO       | 'engineer' |      |            |
| is_first_login       | tinyint         | NO       | 1       |      |            |

### clients

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| name                 | varchar         | NO       | NULL    | UNI  |            |
| code                 | varchar         | YES      | NULL    |      |            |
| email                | varchar         | YES      | NULL    |      |            |
| phone                | varchar         | YES      | NULL    |      |            |
| address              | varchar         | YES      | NULL    |      |            |
| city                 | varchar         | YES      | NULL    |      |            |
| state                | varchar         | YES      | NULL    |      |            |
| country              | varchar         | YES      | NULL    |      |            |
| industry             | varchar         | YES      | NULL    |      |            |
| notes                | text            | YES      | NULL    |      |            |
| status               | varchar         | NO       | 'active' |      |            |
| activeProjects       | int             | NO       | 0       |      |            |
| totalProjects        | int             | NO       | 0       |      |            |
| contact_person       | varchar         | YES      | NULL    |      |            |
| postal_code          | varchar         | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |
| categories           | longtext        | YES      | NULL    |      |            |
| website              | varchar         | YES      | NULL    |      |            |

### projects

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| project_code         | varchar         | NO       | NULL    | UNI  |            |
| title                | varchar         | NO       | NULL    |      |            |
| client_id            | varchar         | NO       | NULL    |      |            |
| status               | enum            | NO       | 'pre-lim' |      |            |
| inquiry_date         | datetime        | YES      | NULL    |      |            |
| po_received_date     | datetime        | YES      | NULL    |      |            |
| po_file_url          | varchar         | YES      | NULL    |      |            |
| completion_date      | datetime        | YES      | NULL    |      |            |
| invoiced_date        | datetime        | YES      | NULL    |      |            |
| start_date           | datetime        | NO       | NULL    |      |            |
| planned_hours        | int             | NO       | NULL    |      |            |
| actual_hours         | int             | NO       | 0       |      |            |
| lead_engineer_id     | varchar         | YES      | NULL    | MUL  |            |
| manager_id           | varchar         | NO       | NULL    | MUL  |            |
| remarks              | text            | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |
| categories           | longtext        | YES      | NULL    |      |            |

### timesheets

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| project_id           | varchar         | NO       | NULL    | MUL  |            |
| engineer_id          | varchar         | NO       | NULL    | MUL  |            |
| date                 | datetime        | NO       | NULL    | MUL  |            |
| hours                | decimal         | NO       | NULL    |      |            |
| work_category        | enum            | NO       | NULL    |      |            |
| description          | text            | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |

### purchase_orders

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| po_number            | varchar         | NO       | NULL    | UNI  |            |
| project_code         | varchar         | NO       | NULL    | MUL  |            |
| client_name          | varchar         | NO       | NULL    |      |            |
| amount               | decimal         | NO       | NULL    |      |            |
| received_date        | datetime        | NO       | NULL    |      |            |
| due_date             | datetime        | YES      | NULL    |      |            |
| description          | text            | YES      | NULL    |      |            |
| status               | enum            | NO       | 'received' |      |            |
| file_url             | varchar         | YES      | NULL    |      |            |
| created_at           | datetime        | YES      | current_timestamp() | MUL  |            |
| updated_at           | datetime        | YES      | current_timestamp() |      | on update current_timestamp() |
| currency             | varchar         | NO       | 'MYR'   |      |            |
| amount_myr           | decimal         | YES      | NULL    |      |            |
| exchange_rate        | decimal         | YES      | NULL    |      |            |
| revision_number      | int             | NO       | 1       |      |            |
| is_active            | tinyint         | NO       | 1       | MUL  |            |
| superseded_by        | varchar         | YES      | NULL    | MUL  |            |
| supersedes           | varchar         | YES      | NULL    | MUL  |            |
| revision_date        | datetime        | NO       | current_timestamp() |      |            |
| revision_reason      | text            | YES      | NULL    |      |            |
| amount_myr_adjusted  | decimal         | YES      | NULL    |      |            |
| adjustment_reason    | text            | YES      | NULL    |      |            |
| adjusted_by          | varchar         | YES      | NULL    | MUL  |            |
| adjusted_at          | datetime        | YES      | NULL    |      |            |
| po_number_base       | varchar         | NO       | ''      | MUL  |            |

### invoices

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| invoice_number       | varchar         | NO       | NULL    | UNI  |            |
| project_code         | varchar         | NO       | NULL    | MUL  |            |
| project_name         | varchar         | NO       | NULL    |      |            |
| amount               | decimal         | NO       | NULL    |      |            |
| invoice_date         | datetime        | NO       | NULL    | MUL  |            |
| percentage_of_total  | decimal         | NO       | NULL    |      |            |
| invoice_sequence     | int             | NO       | NULL    |      |            |
| cumulative_percentage | decimal         | NO       | NULL    |      |            |
| remark               | text            | YES      | NULL    |      |            |
| status               | enum            | NO       | 'draft' | MUL  |            |
| file_url             | varchar         | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp() |      |            |
| updated_at           | datetime        | NO       | current_timestamp() |      | on update current_timestamp() |
| currency             | varchar         | NO       | 'MYR'   |      |            |
| amount_myr           | decimal         | YES      | NULL    |      |            |
| exchange_rate        | decimal         | YES      | NULL    |      |            |

### inventory

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| title                | varchar         | NO       | NULL    |      |            |
| sku                  | varchar         | NO       | NULL    | UNI  |            |
| barcode              | varchar         | YES      | NULL    |      |            |
| category             | varchar         | NO       | NULL    |      |            |
| quantity             | int             | NO       | 0       |      |            |
| minimumStock         | int             | NO       | 0       |      |            |
| location             | varchar         | NO       | NULL    |      |            |
| unitOfMeasure        | varchar         | NO       | NULL    |      |            |
| cost                 | decimal         | NO       | NULL    |      |            |
| price                | decimal         | NO       | NULL    |      |            |
| supplier             | varchar         | YES      | NULL    |      |            |
| status               | enum            | NO       | 'available' |      |            |
| notes                | text            | YES      | NULL    |      |            |
| imageURL             | varchar         | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |
| next_maintenance_date | date            | YES      | NULL    |      |            |
| in_maintenance_quantity | int             | YES      | 0       |      |            |
| last_action          | enum            | YES      | 'added' |      |            |
| last_action_date     | timestamp       | YES      | NULL    |      |            |
| last_action_by       | varchar         | YES      | NULL    |      |            |

### computers

| Column | Type | Nullable | Default | Key | Extra |
|--------|------|----------|---------|-----|-------|
| id                   | varchar         | NO       | NULL    | PRI  |            |
| asset_tag            | varchar         | NO       | NULL    | UNI  |            |
| device_name          | varchar         | NO       | NULL    |      |            |
| computer_type        | enum            | NO       | 'laptop' |      |            |
| manufacturer         | varchar         | YES      | NULL    |      |            |
| model                | varchar         | YES      | NULL    |      |            |
| serial_number        | varchar         | YES      | NULL    |      |            |
| assigned_to          | varchar         | YES      | NULL    | MUL  |            |
| processor            | varchar         | YES      | NULL    |      |            |
| ram                  | varchar         | YES      | NULL    |      |            |
| storage              | varchar         | YES      | NULL    |      |            |
| graphics             | varchar         | YES      | NULL    |      |            |
| os                   | varchar         | YES      | NULL    |      |            |
| os_version           | varchar         | YES      | NULL    |      |            |
| status               | enum            | NO       | 'active' |      |            |
| purchase_cost        | decimal         | YES      | NULL    |      |            |
| purchase_date        | datetime        | YES      | NULL    |      |            |
| warranty_expiry      | datetime        | YES      | NULL    |      |            |
| decommission_date    | datetime        | YES      | NULL    |      |            |
| location             | varchar         | YES      | NULL    |      |            |
| installed_software   | text            | YES      | NULL    |      |            |
| notes                | text            | YES      | NULL    |      |            |
| created_at           | datetime        | NO       | current_timestamp(6) |      |            |
| updated_at           | datetime        | NO       | current_timestamp(6) |      | on update current_timestamp(6) |

## Foreign Key Relationships

| Table | Column | References Table | References Column |
|-------|--------|------------------|------------------|
| activities           | user_id         | users              | id |
| checkouts            | user_id         | users              | id |
| checkouts            | item_id         | inventory          | id |
| computers            | assigned_to     | users              | id |
| maintenance_tickets  | item_id         | inventory          | id |
| maintenance_tickets  | reported_by     | users              | id |
| maintenance_tickets  | assigned_to     | users              | id |
| projects             | lead_engineer_id | users              | id |
| projects             | manager_id      | users              | id |
| research_projects    | lead_researcher_id | users              | id |
| research_timesheets  | engineer_id     | users              | id |
| research_timesheets  | research_project_id | research_projects  | id |
| team_members         | user_id         | users              | id |
| timesheets           | project_id      | projects           | id |
| timesheets           | engineer_id     | users              | id |

## Performance Indexes


**activities.FK_b82f1d8368dd5305ae7e7e664c2** (Non-unique)
- user_id

**checkouts.FK_000468c91f3470cf5d7897f6e2f** (Non-unique)
- item_id

**checkouts.FK_24f9f28b7675d85d081881e32a3** (Non-unique)
- user_id

**clients.IDX_99e921caf21faa2aab020476e4** (Unique)
- name

**computers.FK_82515a9b1ba8978695e70390ccd** (Non-unique)
- assigned_to

**computers.IDX_213ef2d53445c1f4285ea0f14b** (Unique)
- asset_tag

**inventory.IDX_c33f32cdf6993fe3852073b0d5** (Unique)
- sku

**invoices.IDX_invoices_invoice_date** (Non-unique)
- invoice_date

**invoices.IDX_invoices_project_code** (Non-unique)
- project_code

**invoices.IDX_invoices_status** (Non-unique)
- status

**invoices.UQ_d8f8d3788694e1b3f96c42c36fb** (Unique)
- invoice_number

**issued_pos.UQ_233acd3b08ef8c62ff1b4150765** (Unique)
- po_number

**maintenance_tickets.FK_2c2c9aecc5dcca1261816420d9d** (Non-unique)
- assigned_to

**maintenance_tickets.FK_7767c461f000861afcc898418e9** (Non-unique)
- reported_by

**maintenance_tickets.FK_e8fbd824b2716458cdf5a0f65b7** (Non-unique)
- item_id

**projects.IDX_11b19c7d40d07fc1a4e167995e** (Unique)
- project_code

**projects.IDX_projects_lead_engineer_id** (Non-unique)
- lead_engineer_id

**projects.IDX_projects_manager_id** (Non-unique)
- manager_id

**project_hourly_rates.IDX_projectId** (Non-unique)
- projectId

**project_hourly_rates.IDX_project_team** (Unique)
- projectId
- teamMemberId

**project_hourly_rates.IDX_teamMemberId** (Non-unique)
- teamMemberId

**purchase_orders.FK_po_adjusted_by** (Non-unique)
- adjusted_by

**purchase_orders.FK_po_superseded_by** (Non-unique)
- superseded_by

**purchase_orders.FK_po_supersedes** (Non-unique)
- supersedes

**purchase_orders.IDX_is_active** (Non-unique)
- is_active

**purchase_orders.IDX_po_base_active_rev** (Non-unique)
- po_number_base
- is_active
- revision_number

**purchase_orders.IDX_po_number_base** (Non-unique)
- po_number_base

**purchase_orders.IDX_purchase_orders_created_at** (Non-unique)
- created_at

**purchase_orders.IDX_purchase_orders_is_active** (Non-unique)
- is_active

**purchase_orders.IDX_purchase_orders_project_code** (Non-unique)
- project_code

**purchase_orders.po_number** (Unique)
- po_number

**research_projects.FK_d9d4a53a57f65a1db73049c24bf** (Non-unique)
- lead_researcher_id

**research_projects.IDX_334ec21bad136a1eb94a4e80b5** (Unique)
- research_code

**research_timesheets.IDX_date** (Non-unique)
- date

**research_timesheets.IDX_engineer_id** (Non-unique)
- engineer_id

**research_timesheets.IDX_research_project_id** (Non-unique)
- research_project_id

**team_members.IDX_team_members_user_id** (Non-unique)
- user_id

**team_members.REL_c2bf4967c8c2a6b845dadfbf3d** (Unique)
- user_id

**timesheets.IDX_timesheets_date** (Non-unique)
- date

**timesheets.IDX_timesheets_engineer_id** (Non-unique)
- engineer_id

**timesheets.IDX_timesheets_project_id** (Non-unique)
- project_id

**token_blacklist.idx_expires_at** (Non-unique)
- expires_at

**token_blacklist.idx_token_hash** (Non-unique)
- token_hash

**token_blacklist.idx_user_id** (Non-unique)
- user_id

**users.IDX_97672ac88f789774dd47f7c8be** (Unique)
- email

## Migration Recommendations

### Pre-Migration Checklist

1. ✅ Database uses MySQL with InnoDB engine - Compatible with cPanel MySQL
2. ✅ Uses utf8mb4 charset - Recommended for full Unicode support
3. ✅ All tables use UUID primary keys - Good for distributed systems
4. ✅ Proper timestamp fields with timezone support
5. ✅ Soft delete support implemented

### Migration Steps

1. **Export Data**: Use mysqldump or phpMyAdmin to export all data
2. **Create Database**: Create new database in cPanel MySQL
3. **Import Schema**: Import table structures and constraints
4. **Import Data**: Import all data maintaining referential integrity
5. **Update Configuration**: Modify .env with new database credentials
6. **Test Connections**: Verify all entities and relationships work
7. **Run Migrations**: Execute any pending migrations

### cPanel Configuration Requirements

- **MySQL Version**: 5.7+ or 8.0+ (recommended)
- **Database Name**: Use prefix (e.g., username_mycae_tracker)
- **User Permissions**: Full privileges on the database
- **Max Connections**: Ensure sufficient connection limit
- **Storage**: Minimum 100MB allocated space

### Post-Migration Verification

1. Verify all 19 tables are created
2. Verify record counts match source database
3. Test all foreign key relationships
4. Verify application connectivity
5. Test all CRUD operations
6. Verify file upload functionality

### Potential Issues & Solutions

**Issue**: UUID primary keys may need different handling
**Solution**: Ensure MySQL version supports varchar(36) primary keys

**Issue**: JSON columns may not be supported in older MySQL
**Solution**: Use MySQL 5.7+ or convert JSON to TEXT

**Issue**: Large text fields may hit size limits
**Solution**: Monitor storage allocation and optimize if needed

