import { Router } from 'express';

const router = Router();

// System health and status endpoints
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// System information endpoint
router.get('/info', (req, res) => {
  res.json({
    application: 'WriteCareNotes Enterprise',
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

// System diagnostics endpoint
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(diagnostics);
  } catch (error: any) {
    console.error('System diagnostics error:', error);
    res.status(500).json({ error: 'Failed to retrieve system diagnostics' });
  }
});

export default router;