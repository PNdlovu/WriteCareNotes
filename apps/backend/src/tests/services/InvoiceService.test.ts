import { InvoiceService } from '../../services/financial/InvoiceService';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/financial/Invoice';

// Mock the repository
jest.mock('typeorm', () => ({
  Repository: jest.fn(),
}));

// Mock the database
jest.mock('../../config/database', () => ({
  getRepository: jest.fn(),
}));

// Mock the audit service
jest.mock('../../services/audit/AuditTrailService', () => ({
  AuditTrailService: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('InvoiceService', () => {
  letservice: InvoiceService;
  letmockRepository: jest.Mocked<Repository<Invoice>>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    (require('../../config/database').default.getRepository as jest.Mock).mockReturnValue(mockRepository);
    service = new InvoiceService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should create a new invoice successfully', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountDue: 1000.00,
        recipientId: 'recipient-1',
        items: [
          {
            description: 'Care services',
            quantity: 1,
            unitPrice: 1000.00,
            totalPrice: 1000.00
          }
        ],
        paymentTerms: 'NET_30'
      };

      const expectedInvoice = {
        id: 'invoice-1',
        ...invoiceData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.create.mockReturnValue(expectedInvoice as any);
      mockRepository.save.mockResolvedValue(expectedInvoice as any);

      const result = await service.createInvoice(invoiceData);

      expect(mockRepository.create).toHaveBeenCalledWith(invoiceData);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedInvoice);
      expect(result).toEqual(expectedInvoice);
    });

    it('should throw error when invoice creation fails', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountDue: 1000.00,
        recipientId: 'recipient-1',
        items: [],
        paymentTerms: 'NET_30'
      };

      const error = new Error('Database error');
      mockRepository.create.mockReturnValue(invoiceData as any);
      mockRepository.save.mockRejectedValue(error);

      await expect(service.createInvoice(invoiceData)).rejects.toThrow('Database error');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        invoiceNumber: '',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
        amountDue: -100,
        recipientId: '',
        items: [],
        paymentTerms: 'NET_30'
      };

      await expect(service.createInvoice(invalidData)).rejects.toThrow();
    });
  });

  describe('listInvoices', () => {
    it('should return all invoices', async () => {
      const expectedInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          amountDue: 1000.00,
          status: 'DRAFT'
        },
        {
          id: 'invoice-2',
          invoiceNumber: 'INV-002',
          amountDue: 2000.00,
          status: 'SENT'
        }
      ];

      mockRepository.find.mockResolvedValue(expectedInvoices as any);

      const result = await service.listInvoices();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedInvoices);
    });

    it('should filter invoices by status', async () => {
      const status = 'DRAFT';
      const expectedInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          amountDue: 1000.00,
          status: 'DRAFT'
        }
      ];

      mockRepository.find.mockResolvedValue(expectedInvoices as any);

      const result = await service.listInvoices({ status });

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status } });
      expect(result).toEqual(expectedInvoices);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.find.mockRejectedValue(error);

      await expect(service.listInvoices()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice by ID', async () => {
      const id = 'invoice-1';
      const expectedInvoice = {
        id,
        invoiceNumber: 'INV-001',
        amountDue: 1000.00,
        status: 'DRAFT'
      };

      mockRepository.findOne.mockResolvedValue(expectedInvoice as any);

      const result = await service.getInvoiceById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedInvoice);
    });

    it('should return null when invoice not found', async () => {
      const id = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getInvoiceById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice successfully', async () => {
      const id = 'invoice-1';
      const updateData = {
        amountDue: 1500.00,
        status: 'SENT'
      };

      const updatedInvoice = {
        id,
        invoiceNumber: 'INV-001',
        amountDue: 1500.00,
        status: 'SENT'
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedInvoice as any);

      const result = await service.updateInvoice(id, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(id, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(updatedInvoice);
    });

    it('should return null when invoice not found', async () => {
      const id = 'non-existent-id';
      const updateData = { status: 'SENT' };

      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      const result = await service.updateInvoice(id, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      const id = 'invoice-1';

      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteInvoice(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when invoice not found', async () => {
      const id = 'non-existent-id';

      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.deleteInvoice(id);

      expect(result).toBe(false);
    });
  });

  describe('markInvoiceAsPaid', () => {
    it('should mark invoice as paid successfully', async () => {
      const id = 'invoice-1';
      const paymentId = 'payment-1';

      const updatedInvoice = {
        id,
        status: 'PAID',
        relatedPaymentId: paymentId
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedInvoice as any);

      const result = await service.markInvoiceAsPaid(id, paymentId);

      expect(mockRepository.update).toHaveBeenCalledWith(id, {
        status: 'PAID',
        relatedPaymentId: paymentId
      });
      expect(result).toEqual(updatedInvoice);
    });

    it('should return null when invoice not found', async () => {
      const id = 'non-existent-id';
      const paymentId = 'payment-1';

      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      const result = await service.markInvoiceAsPaid(id, paymentId);

      expect(result).toBeNull();
    });
  });

  describe('reconcileInvoicePayment', () => {
    it('should reconcile invoice payment successfully', async () => {
      const invoiceId = 'invoice-1';
      const paymentId = 'payment-1';
      const amount = 1000.00;

      const reconciledInvoice = {
        id: invoiceId,
        status: 'PAID',
        relatedPaymentId: paymentId
      };

      mockRepository.findOne.mockResolvedValue(reconciledInvoice as any);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.reconcileInvoicePayment(invoiceId, paymentId, amount);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: invoiceId } });
      expect(mockRepository.update).toHaveBeenCalledWith(invoiceId, {
        status: 'PAID',
        relatedPaymentId: paymentId
      });
      expect(result).toEqual(reconciledInvoice);
    });

    it('should throw error when invoice not found', async () => {
      const invoiceId = 'non-existent-id';
      const paymentId = 'payment-1';
      const amount = 1000.00;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.reconcileInvoicePayment(invoiceId, paymentId, amount))
        .rejects.toThrow('Invoice not found');
    });
  });

  describe('getInvoiceSummary', () => {
    it('should return invoice summary', async () => {
      const invoices = [
        { id: '1', amountDue: 1000, status: 'DRAFT' },
        { id: '2', amountDue: 2000, status: 'SENT' },
        { id: '3', amountDue: 1500, status: 'PAID' }
      ];

      mockRepository.find.mockResolvedValue(invoices as any);

      const result = await service.getInvoiceSummary();

      expect(result).toEqual({
        totalInvoices: 3,
        totalAmount: 4500,
        draftInvoices: 1,
        sentInvoices: 1,
        paidInvoices: 1,
        overdueInvoices: 0
      });
    });
  });
});
