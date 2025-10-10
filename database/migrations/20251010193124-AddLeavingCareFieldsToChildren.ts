import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add Leaving Care Status and British Isles Jurisdiction Fields
 * 
 * Adds three new fields to children table:
 * 1. leavingCareStatus - UK-wide classification (ELIGIBLE, RELEVANT, FORMER_RELEVANT, etc.)
 * 2. leavingCareJurisdiction - British Isles region (England, Scotland, Wales, Northern Ireland)
 * 3. maxSupportAge - Maximum age for leaving care support (25 or 26)
 * 
 * BRITISH ISLES COMPLIANCE:
 * - Children (Leaving Care) Act 2000 (England & Wales)
 * - Regulation of Care (Scotland) Act 2001 (support to 26)
 * - Children (Leaving Care) Act (Northern Ireland) 2002
 * - Staying Put Scotland 2013
 * - Social Services and Well-being (Wales) Act 2014
 * 
 * LEAVING CARE STATUS VALUES:
 * - ELIGIBLE: 16-17, in care 13+ weeks after 14th birthday (England/Wales/NI)
 * - RELEVANT: 16-17, left care after 16 (England/Wales/NI)
 * - FORMER_RELEVANT: 18-25, previously relevant (England/Wales/NI)
 * - CONTINUING_CARE: Scotland-specific, can extend to 26
 * - AFTERCARE: Scotland, left care before 16
 * - THROUGHCARE: Scotland, preparing for leaving care
 * - NOT_APPLICABLE: Under 16 or not eligible
 */
export class AddLeavingCareFieldsToChildren20251010193124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add leavingCareStatus enum column
    await queryRunner.addColumn(
      'children',
      new TableColumn({
        name: 'leaving_care_status',
        type: 'enum',
        enum: [
          'ELIGIBLE',
          'RELEVANT',
          'FORMER_RELEVANT',
          'CONTINUING_CARE',
          'AFTERCARE',
          'THROUGHCARE',
          'NOT_APPLICABLE'
        ],
        default: "'NOT_APPLICABLE'",
        isNullable: false,
        comment: 'Leaving care status classification (UK-wide)'
      })
    );

    // Add leavingCareJurisdiction enum column (ALL 8 BRITISH ISLES JURISDICTIONS)
    await queryRunner.addColumn(
      'children',
      new TableColumn({
        name: 'leaving_care_jurisdiction',
        type: 'enum',
        enum: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Jersey', 'Guernsey', 'Isle of Man'],
        isNullable: true,
        comment: 'British Isles jurisdiction for leaving care support (all 8 jurisdictions)'
      })
    );

    // Add maxSupportAge integer column
    await queryRunner.addColumn(
      'children',
      new TableColumn({
        name: 'max_support_age',
        type: 'int',
        isNullable: true,
        comment: 'Maximum age for leaving care support (25 England/Wales/NI, 26 Scotland)'
      })
    );

    // Set default maxSupportAge based on leavingCareJurisdiction (for existing records)
    // England, Wales, Northern Ireland, Jersey, Guernsey, Isle of Man: 25
    await queryRunner.query(`
      UPDATE children 
      SET max_support_age = 25 
      WHERE leaving_care_jurisdiction IN ('England', 'Wales', 'Northern Ireland', 'Jersey', 'Guernsey', 'Isle of Man')
      AND is_eligible_for_leaving_care = true
    `);

    // Scotland: 26 (Continuing Care)
    await queryRunner.query(`
      UPDATE children 
      SET max_support_age = 26 
      WHERE leaving_care_jurisdiction = 'Scotland'
      AND is_eligible_for_leaving_care = true
    `);

    // Ireland: 23 (Aftercare Act 2015)
    await queryRunner.query(`
      UPDATE children 
      SET max_support_age = 23 
      WHERE leaving_care_jurisdiction = 'Ireland'
      AND is_eligible_for_leaving_care = true
    `);

    // Auto-detect leavingCareStatus for eligible children (16+)
    // ELIGIBLE: Currently in care, age 16-17
    await queryRunner.query(`
      UPDATE children 
      SET leaving_care_status = 'ELIGIBLE'
      WHERE is_eligible_for_leaving_care = true
      AND EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 16 AND 17
      AND status = 'ACTIVE'
    `);

    // FORMER_RELEVANT: Age 18-25, previously in care
    await queryRunner.query(`
      UPDATE children 
      SET leaving_care_status = 'FORMER_RELEVANT'
      WHERE is_eligible_for_leaving_care = true
      AND EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 18 AND 25
      AND status IN ('DISCHARGED', 'TRANSFERRED')
    `);

    // CONTINUING_CARE: Scotland, age 18-26
    await queryRunner.query(`
      UPDATE children 
      SET leaving_care_status = 'CONTINUING_CARE'
      WHERE is_eligible_for_leaving_care = true
      AND leaving_care_jurisdiction = 'Scotland'
      AND EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 18 AND 26
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('children', 'max_support_age');
    await queryRunner.dropColumn('children', 'leaving_care_jurisdiction');
    await queryRunner.dropColumn('children', 'leaving_care_status');
  }
}
