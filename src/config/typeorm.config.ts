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