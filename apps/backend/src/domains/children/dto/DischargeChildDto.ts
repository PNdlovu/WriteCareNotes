/**
 * Discharge Child DTO
 * Data transfer object for discharging a child from a placement
 */

export class DischargeChildDto {
  dischargeDate: Date;
  dischargeReason: string;
  dischargeDestination?: string;
  dischargeNotes?: string;
}
