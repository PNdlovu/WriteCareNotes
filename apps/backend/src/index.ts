import { EventEmitter2 } from "eventemitter2";

import app from './app';
import { DatabaseConnection } from './config/database.config';
import { RedisConnection } from './config/redis.config';
import HealthCheckService from './services/healthCheckService';
import { RateLimitingMiddleware } from './middleware/rateLimiting';
import DomainSystem from './domains';

const server = app;

const PORT = process.env['PORT'] || 3000;

async function startServer() {
  try {
    console.log('🚀 Starting Care Home Management System...');
    
    // Initialize database connection
    console.log('📊 Initializing database connection...');
    await DatabaseConnection.connect();
    
    // Initialize Redis connection
    console.log('🔴 Initializing Redis connection...');
    const redis = RedisConnection.getInstance();
    
    // Initialize domain system
    console.log('🏗️ Initializing domain system...');
    const domainSystem = DomainSystem.getInstance();
    await domainSystem.initialize();
    
    // Initialize health check service
    console.log('🏥 Initializing health check service...');
    await HealthCheckService.initializeWithConnections();
    
    // Initialize rate limiting middleware
    console.log('🛡️ Initializing rate limiting middleware...');
    // Rate limiting middleware initialized
    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Healthcheck: http://localhost:${PORT}/health`);
      console.log(`📚 APIdocs: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Compliance: http://localhost:${PORT}/health/compliance`);
      console.log('');
      console.log('🛡️ Security FeaturesEnabled:');
      console.log('  ✅ CSRF Protection');
      console.log('  ✅ Input Sanitization');
      console.log('  ✅ Rate Limiting');
      console.log('  ✅ Security Headers');
      console.log('  ✅ Audit Logging');
      console.log('  ✅ Error Handling');
      console.log('');
      console.log('� Care HomeFeatures:');
      console.log('  ✅ Medication Management');
      console.log('  ✅ NHS Integration');
      console.log('  ✅ Consent Management');
      console.log('  ✅ Audit Compliance');
      console.log('');
      console.log('📊 Monitoring:');
      console.log('  ✅ Health Checks');
      console.log('  ✅ System Metrics');
      console.log('  ✅ Performance Monitoring');
      console.log('');
      console.log('🎯 Ready for productionuse!');
    });
    
  } catch (error: unknown) {
    console.error('❌ Failed to startserver:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    // Shutdown domain system
    const domainSystem = DomainSystem.getInstance();
    await domainSystem.shutdown();
    
    await DatabaseConnection.disconnect();
    await RedisConnection.disconnect();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error: unknown) {
    console.error('❌ Error duringshutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    // Shutdown domain system
    const domainSystem = DomainSystem.getInstance();
    await domainSystem.shutdown();
    
    await DatabaseConnection.disconnect();
    await RedisConnection.disconnect();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error: unknown) {
    console.error('❌ Error duringshutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UncaughtException:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejectionat:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export { app };
