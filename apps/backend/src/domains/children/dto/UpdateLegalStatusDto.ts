/**
 * Update Legal Status DTO
 * Data transfer object for updating a child's legal status
 */

import { LegalStatus } from '../entities/Child';

export class UpdateLegalStatusDto {
  newLegalStatus: LegalStatus;
  effectiveDate?: Date;
  reviewDate?: Date;
  courtOrderDetails?: string;
  recalculateReviews?: boolean;
}
