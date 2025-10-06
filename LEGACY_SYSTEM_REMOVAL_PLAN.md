# LEGACY COMMUNICATION SYSTEM REMOVAL PLAN

## 🗑️ **FILES TO REMOVE** (Phase 1: Safe to Delete)

### **Old Service Files**
- [ ] `src/services/communication/CommunicationService.ts` (597 lines)
- [ ] `src/services/notifications/NotificationService.ts` (100 lines) 
- [ ] `src/services/communication/CommunicationEngagementService.ts` (1,250 lines)

### **Old Entity Files**
- [ ] `src/entities/communication/VideoCall.ts` (all VideoCall functionality moved to enhanced CommunicationSession)
- [ ] `src/entities/communication/CommunicationChannel.ts` (replaced by enhanced channels table)
- [ ] `src/entities/communication/CommunicationMessage.ts` (replaced by enhanced messages table)

### **Old Migration Files**
- [ ] `database/migrations/CreateCommunicationTables` (replaced by unified schema)
- [ ] Any video_calls table migrations
- [ ] Any communication_channels table migrations

### **Old Route Files**
- [ ] `src/routes/communication-engagement.ts` (replaced by WriteCareConnect routes)
- [ ] `src/routes/communication-service.ts` (replaced by WriteCareConnect routes)

### **Old Controller Files**
- [ ] `src/controllers/communication/CommunicationEngagementController.ts`
- [ ] Any other communication controllers using old system

### **Old Test Files**
- [ ] `src/tests/unit/communication/CommunicationService.test.ts`
- [ ] `src/tests/integration/communication/CommunicationIntegration.test.ts`
- [ ] `src/tests/e2e/communication/CommunicationE2E.test.ts`

---

## 🔄 **REPLACEMENT MAPPING**

### **Service Replacements**
| **Old Service** | **New WriteCareConnect Service** | **Status** |
|----------------|----------------------------------|------------|
| CommunicationService.ts | RealtimeMessagingService.ts | ✅ Enhanced |
| NotificationService.ts | RealtimeMessagingService.ts | ✅ Integrated |
| CommunicationEngagementService.ts | CommunicationSessionService.ts | ✅ Enhanced |
| VideoCall entity | CommunicationSessionService.ts | ✅ Enhanced |

### **Database Replacements**
| **Old Tables** | **New Unified Tables** | **Status** |
|---------------|----------------------|------------|
| video_calls | communication_sessions | ✅ Migrated |
| communication_channels | channels | ✅ Migrated |
| communication_messages | messages | ✅ Migrated |

### **Route Replacements**
| **Old Routes** | **New WriteCareConnect Routes** | **Status** |
|---------------|--------------------------------|------------|
| `/api/communication-engagement/*` | `/api/writecare-connect/sessions/*` | ✅ Ready |
| `/api/communication-service/*` | `/api/writecare-connect/messaging/*` | ✅ Ready |

---

## 📋 **REMOVAL EXECUTION PLAN**

### **Phase 1: Remove Service Files** (Safe)
1. Delete old service files that are no longer imported
2. Remove old entity files
3. Clean up old migration files

### **Phase 2: Update Import References** (Systematic)
1. Fix remaining import references to use WriteCareConnect services
2. Update constructor dependencies
3. Replace method calls with new API

### **Phase 3: Remove Routes and Controllers** (Final)
1. Remove old route files
2. Delete old controller files
3. Update main server file to use new routes

### **Phase 4: Clean Database** (Database)
1. Run unified migration to replace old tables
2. Drop old tables
3. Remove old constraints and indexes

---

## ⚠️ **CURRENT IMPORT DEPENDENCIES**

### **Services Using Old NotificationService**
- ConsentService.ts ✅ (import updated, need constructor fix)
- StaffRevolutionService.ts ✅ (import updated, need constructor fix)
- FamilyTrustEngineService.ts ✅ (import updated, need constructor fix)
- ResidentVoiceService.ts ✅ (import updated, need constructor fix)
- AdvocacyManagementService.ts ✅ (import updated, need constructor fix)
- CareQualityIntelligenceService.ts (pending)
- CommunityConnectionHubService.ts (pending)

### **Mobile App Dependencies**
- mobile/src/services/NotificationService.ts (separate mobile service)
- mobile/src/screens/*/components using old communication

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Delete Safe Files** - Remove services that are no longer imported anywhere
2. **Create Compatibility Layer** - Temporary wrapper to fix constructor issues
3. **Update Database Schema** - Apply unified migration
4. **Remove Old Routes** - Clean up route files
5. **Update Documentation** - Remove references to old system

---

## ✅ **SUCCESS CRITERIA**

- [ ] Zero references to old communication services
- [ ] All functionality preserved in WriteCareConnect
- [ ] Database consolidated to unified schema
- [ ] No broken imports or dependencies
- [ ] Tests passing with new system
- [ ] Documentation updated

This plan ensures **zero functionality loss** while achieving **complete consolidation** of the communication system.