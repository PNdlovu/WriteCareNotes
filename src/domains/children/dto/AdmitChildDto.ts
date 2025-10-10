/**
 * Admit Child DTO
 * Data transfer object for admitting a child to a placement
 * 
 * British Isles Compliance:
 * - Validates legal status against child's jurisdiction
 * - Ensures placement type meets jurisdiction-specific requirements
 * - Supports all 8 jurisdictions: England, Wales, Scotland, Northern Ireland, 
 *   Ireland, Jersey, Guernsey, Isle of Man
 */

import { LegalStatus, PlacementType, Jurisdiction } from '../entities/Child';

export class AdmitChildDto {
  /**
   * Date of admission to placement
   */
  admissionDate: Date;

  /**
   * Type of placement (e.g., residential, foster care)
   * Must meet jurisdiction-specific placement requirements
   */
  placementType: PlacementType;

  /**
   * Legal status of the child
   * MUST be valid for the child's jurisdiction:
   * - England/Wales: Section 20, Section 31, Section 38, EPO
   * - Scotland: CSO, Permanence Order, CPO
   * - Northern Ireland: Care Order NI, Residence Order NI, EPO NI
   * - Ireland: Care Order IE, Interim Care Order, Emergency Care Order, Voluntary Care
   * - Jersey/Guernsey/IoM: Jurisdiction-specific orders
   */
  legalStatus: LegalStatus;

  /**
   * Expected discharge date (if known)
   */
  expectedDischargeDate?: Date;

  /**
   * Notes about the admission
   */
  admissionNotes?: string;
}
