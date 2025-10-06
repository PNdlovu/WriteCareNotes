import { createConnection } from 'typeorm';
import { seedVisitorManagementData } from './VisitorSeedData';
import AppDataSource from '../../config/database';

/**
 * Main seeding script for visitor management system
 */
async function runSeedData(): Promise<void> {
  console.log('🚀 Starting visitor management seeding process...');
  
  let connection: any;
  
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      connection = await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    // Run visitor management seeds
    await seedVisitorManagementData();
    
    console.log('🎉 All seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Family visitors: 8 profiles with comprehensive visit histories');
    console.log('- Professional visitors: 5 profiles with medical/care backgrounds');
    console.log('- Contractor visitors: 4 profiles with various specializations');
    console.log('- Volunteer visitors: 3 profiles with activity/therapy focus');
    console.log('- Inspector visitors: 3 profiles for regulatory compliance');
    console.log('- Background checks: Sample verification data');
    console.log('- Visit histories: Realistic patterns and satisfaction ratings');
    console.log('- Security incidents: Sample incident data for testing');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Execute seeding if run directly
if (require.main === module) {
  runSeedData()
    .then(() => {
      console.log('✨ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error);
      process.exit(1);
    });
}

export { runSeedData };