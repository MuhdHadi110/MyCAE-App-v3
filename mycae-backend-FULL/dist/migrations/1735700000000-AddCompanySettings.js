"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCompanySettings1735700000000 = void 0;
const typeorm_1 = require("typeorm");
class AddCompanySettings1735700000000 {
    async up(queryRunner) {
        // Create company_settings table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'company_settings',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'company_name',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'registration_number',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'address',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'phone',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'mobile',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'sst_id',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'logo_url',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'primary_color',
                    type: 'varchar',
                    length: '7',
                    default: "'#2563eb'",
                },
                {
                    name: 'invoice_footer',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'po_footer',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'bank_details',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'header_position',
                    type: 'varchar',
                    length: '20',
                    default: "'top-center'",
                },
                {
                    name: 'logo_size',
                    type: 'varchar',
                    length: '10',
                    default: "'medium'",
                },
                {
                    name: 'show_sst_id',
                    type: 'boolean',
                    default: true,
                },
                {
                    name: 'show_bank_details',
                    type: 'boolean',
                    default: true,
                },
                {
                    name: 'page_margin',
                    type: 'int',
                    default: 50,
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
            ],
        }), true);
        // Insert default company settings (based on current hardcoded values)
        await queryRunner.query(`
      INSERT INTO company_settings (
        id,
        company_name,
        registration_number,
        address,
        phone,
        mobile,
        email,
        sst_id,
        invoice_footer,
        bank_details
      ) VALUES (
        UUID(),
        'MYCAE TECHNOLOGIES SDN BHD',
        '863273W',
        'UDINI Square, Block 2-03-13A,\nLebuh Tunku Kudin 3,\n11700 Gelugor, Penang, Malaysia',
        '+604 376 2355',
        '+60 17 2008173',
        'kctang@mycae.com.my',
        'P11-1808-31028245',
        'Payment Terms: Please make payment within 30 days from invoice date.',
        '[Add your bank details here]'
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('company_settings');
    }
}
exports.AddCompanySettings1735700000000 = AddCompanySettings1735700000000;
//# sourceMappingURL=1735700000000-AddCompanySettings.js.map