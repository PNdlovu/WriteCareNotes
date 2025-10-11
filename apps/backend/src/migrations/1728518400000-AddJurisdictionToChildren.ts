import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * @fileoverview Add Jurisdiction Column to Children Table
 * @module AddJurisdictionToChildren
 * @version 1.0.0
 * 
 * @description Migration to add jurisdiction support to children table for British Isles compliance.
 * Adds jurisdiction enum column with index for efficient filtering across all 8 jurisdictions:
 * England, Wales, Scotland, Northern Ireland, Ireland, Jersey, Guernsey, Isle of Man
 */
export class AddJurisdictionToChildren1728518400000 implements MigrationInterface {
  name = 'AddJurisdictionToChildren1728518400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for jurisdictions
    await queryRunner.query(`
      CREATE TYPE "jurisdiction_enum" AS ENUM (
        'ENGLAND',
        'WALES', 
        'SCOTLAND',
        'NORTHERN_IRELAND',
        'IRELAND',
        'JERSEY',
        'GUERNSEY',
        'ISLE_OF_MAN'
      )
    `);

    // Add jurisdiction column to children table
    await queryRunner.addColumn('children', new TableColumn({
      name: 'jurisdiction',
      type: 'jurisdiction_enum',
      isNullable: false,
      default: "'ENGLAND'",
      comment: 'British Isles jurisdiction for regulatory compliance (England, Wales, Scotland, NI, Ireland, Jersey, Guernsey, IoM)'
    }));

    // Create index for efficient jurisdiction filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_CHILDREN_JURISDICTION" ON "children" ("jurisdiction")
    `);

    // Create composite index for jurisdiction + status queries
    await queryRunner.query(`
      CREATE INDEX "IDX_CHILDREN_JURISDICTION_STATUS" ON "children" ("jurisdiction", "status")
    `);

    console.log('✅ Added jurisdiction column to children table with British Isles compliance support');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_CHILDREN_JURISDICTION_STATUS"`);
    await queryRunner.query(`DROP INDEX "IDX_CHILDREN_JURISDICTION"`);

    // Drop column
    await queryRunner.dropColumn('children', 'jurisdiction');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "jurisdiction_enum"`);

    console.log('✅ Removed jurisdiction column from children table');
  }
}
