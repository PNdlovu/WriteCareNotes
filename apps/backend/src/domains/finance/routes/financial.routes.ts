import { Router, Request, Response } from 'express';
import { FinancialService } from '../services/FinancialService';

const router = Router();
const financialService = new FinancialService();

// Invoice routes
router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const invoice = await financialService.createInvoice(req.body, req.user?.id || 'system');
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as any,
      type: req.query.type as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      recipientName: req.query.recipientName as string,
      isOverdue: req.query.isOverdue === 'true',
    };
    
    const invoices = await financialService.getInvoices(filters);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await financialService.getInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invoices/:id/send', async (req: Request, res: Response) => {
  try {
    const invoice = await financialService.sendInvoice(req.params.id, req.user?.id || 'system');
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Payment routes
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const payment = await financialService.recordPayment(req.body, req.user?.id || 'system');
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as any,
      method: req.query.method as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
    };
    
    const payments = await financialService.getPayments(filters);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/payments/:id', async (req: Request, res: Response) => {
  try {
    const payment = await financialService.getPayment(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Financial metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as 'month' | 'quarter' | 'year' || 'month';
    const metrics = await financialService.getFinancialMetrics(period);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overdue invoices
router.get('/invoices/overdue', async (req: Request, res: Response) => {
  try {
    const overdueInvoices = await financialService.getOverdueInvoices();
    res.json(overdueInvoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recurring invoices
router.post('/invoices/generate-recurring', async (req: Request, res: Response) => {
  try {
    const generatedInvoices = await financialService.generateRecurringInvoices();
    res.json({ 
      message: `Generated ${generatedInvoices.length} recurring invoices`,
      invoices: generatedInvoices 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
