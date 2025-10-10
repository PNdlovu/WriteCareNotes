/**
 * Placements Module Index
 * Exports all placement domain components
 */

// Entities
export * from './entities/Placement';
export * from './entities/PlacementRequest';
export * from './entities/PlacementAgreement';
export * from './entities/PlacementReview';

// Services
export * from './services/PlacementService';
export * from './services/PlacementMatchingService';

// Controllers
export * from './controllers/PlacementController';

// Routes
export { default as placementsRoutes } from './routes/placements.routes';
