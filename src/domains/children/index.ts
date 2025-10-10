/**
 * Children Module Index
 * Exports all children domain components
 */

// Entities
export * from './entities/Child';

// Services
export * from './services/ChildService';

// Controllers
export * from './controllers/ChildProfileController';

// DTOs
export * from './dto/CreateChildDto';
export * from './dto/UpdateChildDto';
export * from './dto/AdmitChildDto';
export * from './dto/DischargeChildDto';
export * from './dto/TransferChildDto';
export * from './dto/UpdateLegalStatusDto';
export * from './dto/ChildResponseDto';

// Routes
export { default as childrenRoutes } from './routes/children.routes';
