"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitClientsIntoCompaniesContacts1736200000000 = void 0;
const typeorm_1 = require("typeorm");
class SplitClientsIntoCompaniesContacts1736200000000 {
    async up(queryRunner) {
        // Create companies table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'companies',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isUnique: true,
                },
                {
                    name: 'industry',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'website',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'address',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'deleted_at',
                    type: 'timestamp',
                    isNullable: true,
                },
            ],
        }), true);
        // Create index on company name for performance
        await queryRunner.createIndex('companies', new typeorm_1.TableIndex({
            name: 'idx_companies_name',
            columnNames: ['name'],
        }));
        // Create contacts table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'contacts',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                },
                {
                    name: 'company_id',
                    type: 'varchar',
                    length: '36',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'phone',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'position',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'is_primary',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'deleted_at',
                    type: 'timestamp',
                    isNullable: true,
                },
            ],
        }), true);
        // Create foreign key for company_id
        await queryRunner.createForeignKey('contacts', new typeorm_1.TableForeignKey({
            columnNames: ['company_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'companies',
            onDelete: 'CASCADE',
        }));
        // Create indexes for performance
        await queryRunner.createIndex('contacts', new typeorm_1.TableIndex({
            name: 'idx_contacts_company_id',
            columnNames: ['company_id'],
        }));
        await queryRunner.createIndex('contacts', new typeorm_1.TableIndex({
            name: 'idx_contacts_email',
            columnNames: ['email'],
        }));
        // Create unique constraint for company_id + email combination
        await queryRunner.createIndex('contacts', new typeorm_1.TableIndex({
            name: 'unique_contact_email',
            columnNames: ['company_id', 'email'],
            isUnique: true,
        }));
        // Add contact_id column to projects table
        await queryRunner.query(`
      ALTER TABLE projects
      ADD COLUMN contact_id VARCHAR(36) NULL AFTER client_id
    `);
        // Create foreign key for contact_id in projects table
        await queryRunner.createForeignKey('projects', new typeorm_1.TableForeignKey({
            columnNames: ['contact_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'contacts',
            onDelete: 'RESTRICT',
        }));
        // Create index on contact_id for performance
        await queryRunner.createIndex('projects', new typeorm_1.TableIndex({
            name: 'idx_projects_contact_id',
            columnNames: ['contact_id'],
        }));
    }
    async down(queryRunner) {
        // Drop foreign key and index from projects table
        const projectsTable = await queryRunner.getTable('projects');
        const contactForeignKey = projectsTable?.foreignKeys.find((fk) => fk.columnNames.indexOf('contact_id') !== -1);
        if (contactForeignKey) {
            await queryRunner.dropForeignKey('projects', contactForeignKey);
        }
        await queryRunner.dropIndex('projects', 'idx_projects_contact_id');
        await queryRunner.query(`ALTER TABLE projects DROP COLUMN contact_id`);
        // Drop contacts table and its indexes
        await queryRunner.dropIndex('contacts', 'unique_contact_email');
        await queryRunner.dropIndex('contacts', 'idx_contacts_email');
        await queryRunner.dropIndex('contacts', 'idx_contacts_company_id');
        const contactsTable = await queryRunner.getTable('contacts');
        const companyForeignKey = contactsTable?.foreignKeys.find((fk) => fk.columnNames.indexOf('company_id') !== -1);
        if (companyForeignKey) {
            await queryRunner.dropForeignKey('contacts', companyForeignKey);
        }
        await queryRunner.dropTable('contacts');
        // Drop companies table and its indexes
        await queryRunner.dropIndex('companies', 'idx_companies_name');
        await queryRunner.dropTable('companies');
    }
}
exports.SplitClientsIntoCompaniesContacts1736200000000 = SplitClientsIntoCompaniesContacts1736200000000;
//# sourceMappingURL=1736200000000-SplitClientsIntoCompaniesContacts.js.map