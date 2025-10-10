# Medication Scheduling Service - Implementation Plan

**Task**: Implement missing `MedicationSchedulingService` that controller expects

**Status**: ⏳ IN PROGRESS

---

## What Controller Expects

The controller imports these from the service:

```typescript
import { 
  MedicationSchedulingService,  // Main service class
  MedicationSchedule,            // Schedule entity/interface
  MedicationAlert,               // Alert entity/interface
  ScheduleOptimization,          // Optimization result interface
  ScheduleFilters,               // Filter interface for queries
  ScheduleStats,                 // Statistics interface
  OptimizationRule              // Optimization rule interface
} from '../../services/medication/MedicationSchedulingService';
```

## Required Methods (from controller usage)

1. `createMedicationSchedule(prescriptionId, scheduleData, organizationId, userId): Promise<MedicationSchedule>`
2. `generateMedicationAlerts(organizationId, alertTypes?): Promise<MedicationAlert[]>`
3. `optimizeResidentSchedules(residentId, rules, organizationId, userId): Promise<ScheduleOptimization>`
4. `handlePrnRequest(scheduleId, requestData, organizationId, userId): Promise<any>`
5. `updateMedicationSchedule(scheduleId, updates, organizationId, userId): Promise<MedicationSchedule>`
6. `getMedicationSchedules(filters, organizationId, page, limit): Promise<any>`
7. `getSchedulingStats(organizationId): Promise<ScheduleStats>`

## Our Existing Features (to preserve)

From `src/services/medicationScheduleService.ts`:

1. ✅ `MedicationFrequency` enum (OD, BD, TDS, QDS, PRN, WEEKLY, MONTHLY)
2. ✅ `generateSchedule()` - Auto-create doses from frequency
3. ✅ `sendProactiveReminders()` - Cron job 30 min before dose
4. ✅ `calculateAdherence()` - Adherence rate tracking
5. ✅ `generateAdherenceRecommendations()` - AI-powered suggestions
6. ✅ `canAdministerPRN()` - PRN dose spacing enforcement
7. ✅ `analyzePRNUsage()` - PRN usage pattern analysis
8. ✅ `generateChildFriendlyCalendar()` - Visual calendars with emojis

## Implementation Strategy

### Step 1: Create Complete Service File
- Merge our existing scheduling logic
- Add controller-expected interfaces
- Implement controller-expected methods
- Keep all our unique children features

### Step 2: File Location
- **Target**: `src/services/medication/MedicationSchedulingService.ts`
- **Source**: Merge from `src/services/medicationScheduleService.ts`

### Step 3: Testing
- Verify controller can import
- Test with existing routes
- Verify no TypeScript errors

---

**Estimated Time**: 2 hours  
**Priority**: HIGH  
**Status**: Ready to implement

