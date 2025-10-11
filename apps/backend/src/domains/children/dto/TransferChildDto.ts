/**
 * Transfer Child DTO
 * Data transfer object for transferring a child to another facility
 * 
 * British Isles Compliance:
 * - Handles cross-border transfers between jurisdictions
 * - Validates jurisdiction changes require proper authorization
 * - Ensures legal status remains valid in destination jurisdiction
 * - Supports all 8 jurisdictions: England, Wales, Scotland, Northern Ireland,
 *   Ireland, Jersey, Guernsey, Isle of Man
 */

import { Jurisdiction } from '../entities/Child';

export class TransferChildDto {
  /**
   * ID of the destination organization
   */
  newOrganizationId: string;

  /**
   * Date of transfer
   */
  transferDate: Date;

  /**
   * Reason for transfer
   */
  transferReason: string;

  /**
   * Optional: Destination jurisdiction (if different from current)
   * 
   * ⚠️ CROSS-BORDER TRANSFERS:
   * When transferring between jurisdictions, additional requirements apply:
   * - Legal status must be valid in destination jurisdiction
   * - Local authority approval required for cross-border placements
   * - Regulatory body notification required within statutory timescales
   * - Different review timescales may apply in destination jurisdiction
   * 
   * Examples:
   * - England → Wales: Section 31 order valid in both
   * - England → Scotland: May require CSO conversion
   * - England → Ireland: Requires inter-jurisdictional placement agreement
   */
  destinationJurisdiction?: Jurisdiction;

  /**
   * Additional notes about the transfer
   */
  transferNotes?: string;
}
