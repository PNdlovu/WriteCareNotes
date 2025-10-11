import { Router } from 'express';
import dbsRoutes from './dbs.routes';
import rightToWorkRoutes from './right-to-work-new.routes';
import dvlaRoutes from './dvla-new.routes';

const router = Router();

// Mount all HR routes
router.use('/dbs', dbsRoutes);
router.use('/right-to-work', rightToWorkRoutes);
router.use('/dvla', dvlaRoutes);

export default router;
