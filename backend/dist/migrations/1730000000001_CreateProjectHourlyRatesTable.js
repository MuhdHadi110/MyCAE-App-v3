"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProjectHourlyRatesTable1730000000001 = void 0;
const typeorm_1 = require("typeorm");
class CreateProjectHourlyRatesTable1730000000001 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'project_hourly_rates',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                    isGenerated: false,
                },
                {
                    name: 'projectId',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'teamMemberId',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'hourlyRate',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
            indices: [
                {
                    name: 'IDX_project_team',
                    columnNames: ['projectId', 'teamMemberId'],
                    isUnique: true,
                },
                {
                    name: 'IDX_projectId',
                    columnNames: ['projectId'],
                },
                {
                    name: 'IDX_teamMemberId',
                    columnNames: ['teamMemberId'],
                },
            ],
        }), true);
        // Add foreign keys
        await queryRunner.createForeignKey('project_hourly_rates', new typeorm_1.TableForeignKey({
            name: 'FK_project_hourly_rates_project',
            columnNames: ['projectId'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('project_hourly_rates', new typeorm_1.TableForeignKey({
            name: 'FK_project_hourly_rates_team_member',
            columnNames: ['teamMemberId'],
            referencedTableName: 'team_members',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('project_hourly_rates', true);
    }
}
exports.CreateProjectHourlyRatesTable1730000000001 = CreateProjectHourlyRatesTable1730000000001;
//# sourceMappingURL=1730000000001_CreateProjectHourlyRatesTable.js.map