import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Import all entities

// Core entities (Service #1 & #2)
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { Tenant } from '../entities/Tenant';
import { Session } from '../entities/auth/Session';
import { RefreshToken } from '../entities/auth/RefreshToken';
import { PasswordReset } from '../entities/auth/PasswordReset';

// Domain entities
import { Resident } from '../entities/Resident';
import { StaffMember } from '../domains/staff/entities/StaffMember';
import { CareNote } from '../domains/care/entities/CareNote';
import { AuditEvent } from '../entities/audit/AuditEvent';
import { UniversalUser } from '../entities/auth/UniversalUser';
import { Bed } from '../entities/bed/Bed';
import { Room } from '../entities/bed/Room';
import { WaitingListEntry } from '../entities/bed/WaitingListEntry';
import { BlogPost } from '../entities/blog/BlogPost';
import { DataWarehouse } from '../entities/business-intelligence/DataWarehouse';
import { CareDomain } from '../entities/care-planning/CareDomain';
import { CareIntervention } from '../entities/care-planning/CareIntervention';
import { CarePlan } from '../entities/care-planning/CarePlan';
import { Menu } from '../entities/catering/Menu';
import { ResidentDietaryProfile } from '../entities/catering/ResidentDietaryProfile';
import { CommunicationChannel } from '../entities/communication/CommunicationChannel';
import { Message } from '../entities/communication/Message';
import { VideoCall } from '../entities/communication/VideoCall';
import { ZeroTrustSecurity } from '../entities/zero-trust/ZeroTrustSecurity';

// Children's Care System entities (Modules 1-9)
import { Child } from '../domains/children/entities/Child';
import { Placement } from '../domains/placements/entities/Placement';
import { PlacementRequest } from '../domains/placements/entities/PlacementRequest';
import { PlacementAgreement } from '../domains/placements/entities/PlacementAgreement';
import { PlacementReview } from '../domains/placements/entities/PlacementReview';
import { SafeguardingIncident } from '../domains/safeguarding/entities/SafeguardingIncident';
import { ChildProtectionPlan } from '../domains/safeguarding/entities/ChildProtectionPlan';
import { SafeguardingConcern } from '../domains/safeguarding/entities/SafeguardingConcern';
import { PersonalEducationPlan } from '../domains/education/entities/PersonalEducationPlan';
import { SchoolPlacement } from '../domains/education/entities/SchoolPlacement';
import { HealthAssessment } from '../domains/health/entities/HealthAssessment';
import { MedicalConsent } from '../domains/health/entities/MedicalConsent';
import { FamilyMember } from '../domains/family/entities/FamilyMember';
import { ContactSchedule } from '../domains/family/entities/ContactSchedule';
import { ContactSession } from '../domains/family/entities/ContactSession';
import { ContactRiskAssessment } from '../domains/family/entities/ContactRiskAssessment';
import { CarePlan as ChildCarePlan } from '../domains/careplanning/entities/CarePlan';
import { CarePlanReview } from '../domains/careplanning/entities/CarePlanReview';
import { CarePlanGoal } from '../domains/careplanning/entities/CarePlanGoal';
import { PathwayPlan } from '../domains/leavingcare/entities/PathwayPlan';
import { UASCProfile } from '../domains/uasc/entities/UASCProfile';
import { AgeAssessment } from '../domains/uasc/entities/AgeAssessment';
import { ImmigrationStatus } from '../domains/uasc/entities/ImmigrationStatus';
import { HomeOfficeCorrespondence } from '../domains/uasc/entities/HomeOfficeCorrespondence';

// TypeORM DataSource configuration
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_NAME'] || 'carehome_management',
  synchronize: process.env['NODE_ENV'] === 'development',
  logging: process.env['NODE_ENV'] === 'development',
  entities: [
    // Core entities (Service #1 & #2)
    User,
    Organization,
    Tenant,
    Session,
    RefreshToken,
    PasswordReset,
    
    // Domain entities
    Resident,
    StaffMember,
    CareNote,
    AuditEvent,
    UniversalUser,
    Bed,
    Room,
    WaitingListEntry,
    BlogPost,
    DataWarehouse,
    CareDomain,
    CareIntervention,
    CarePlan,
    Menu,
    ResidentDietaryProfile,
    CommunicationChannel,
    Message,
    VideoCall,
    ZeroTrustSecurity,
    
    // Children's Care System entities (Modules 1-9)
    Child,
    Placement,
    PlacementRequest,
    PlacementAgreement,
    PlacementReview,
    SafeguardingIncident,
    ChildProtectionPlan,
    SafeguardingConcern,
    PersonalEducationPlan,
    SchoolPlacement,
    HealthAssessment,
    MedicalConsent,
    FamilyMember,
    ContactSchedule,
    ContactSession,
    ContactRiskAssessment,
    ChildCarePlan,
    CarePlanReview,
    CarePlanGoal,
    PathwayPlan,
    UASCProfile,
    AgeAssessment,
    ImmigrationStatus,
    HomeOfficeCorrespondence,
    // Add more entities as needed
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env['NODE_ENV'] === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Initialize the DataSource
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export default AppDataSource;