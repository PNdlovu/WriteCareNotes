import { Router, Request, Response } from 'express';
import { HRService } from '../services/HRService';

const router = Router();
const hrService = new HRService();

// Employee onboarding
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const result = await hrService.onboardEmployee(req.body, req.user?.id || 'system');
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Time off requests
router.post('/time-off', async (req: Request, res: Response) => {
  try {
    const request = await hrService.submitTimeOffRequest(req.body, req.user?.id || 'system');
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/time-off', async (req: Request, res: Response) => {
  try {
    const filters = {
      employeeId: req.query.employeeId as string,
      status: req.query.status as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };
    
    const requests = await hrService.getTimeOffRequests(filters);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/time-off/:id/approve', async (req: Request, res: Response) => {
  try {
    const request = await hrService.approveTimeOffRequest(
      req.params.id, 
      req.user?.id || 'system',
      req.body.notes
    );
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/time-off/:id/reject', async (req: Request, res: Response) => {
  try {
    const request = await hrService.rejectTimeOffRequest(
      req.params.id, 
      req.user?.id || 'system',
      req.body.reason
    );
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Shift swaps
router.post('/shift-swaps', async (req: Request, res: Response) => {
  try {
    const swap = await hrService.createShiftSwapRequest(req.body, req.user?.id || 'system');
    res.status(201).json(swap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/shift-swaps', async (req: Request, res: Response) => {
  try {
    const filters = {
      employeeId: req.query.employeeId as string,
      status: req.query.status as any,
      type: req.query.type as any,
    };
    
    const swaps = await hrService.getShiftSwaps(filters);
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/shift-swaps/:id/approve', async (req: Request, res: Response) => {
  try {
    const swap = await hrService.approveShiftSwap(
      req.params.id, 
      req.user?.id || 'system',
      req.body.notes
    );
    res.json(swap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/shift-swaps/:id/reject', async (req: Request, res: Response) => {
  try {
    const swap = await hrService.rejectShiftSwap(
      req.params.id, 
      req.user?.id || 'system',
      req.body.reason
    );
    res.json(swap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Employee dashboard
router.get('/employees/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await hrService.getEmployeeDashboard(req.params.id);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HR manager dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await hrService.getHRDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shift planner
router.get('/shift-planner', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const planner = await hrService.getShiftPlanner(startDate, endDate);
    res.json(planner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee management
router.get('/employees', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as any,
      departmentId: req.query.departmentId as string,
      positionId: req.query.positionId as string,
      search: req.query.search as string,
    };
    
    const employees = await hrService.getEmployees(filters);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await hrService.getEmployee(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await hrService.updateEmployee(req.params.id, req.body, req.user?.id || 'system');
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await hrService.getDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Positions
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const positions = await hrService.getPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certifications
router.get('/certifications/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const certifications = await hrService.getExpiringCertifications(days);
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/certifications/:id/renew', async (req: Request, res: Response) => {
  try {
    const certification = await hrService.renewCertification(
      req.params.id, 
      req.body, 
      req.user?.id || 'system'
    );
    res.json(certification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
