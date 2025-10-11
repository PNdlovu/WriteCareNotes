import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from '../entities/Invoice';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { Expense, ExpenseStatus, ExpenseCategory } from '../entities/Expense';
import { ResidentBilling } from '../entities/ResidentBilling';
import { PayrollRun } from '../entities/PayrollRun';
import { Payslip } from '../entities/Payslip';

export interface CreateInvoiceRequest {
  type: InvoiceType;
  recipientName: string;
  recipientAddress: string;
  recipientPostcode?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  invoiceDate: Date;
  dueDate: Date;
  notes?: string;
  terms?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
  residentBillingId?: string;
}

export interface RecordPaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: Date;
  transactionId?: string;
  bankReference?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  notes?: string;
}

export interface FinancialMetrics {
  totalInvoices: number;
  totalInvoiceValue: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  paymentRate: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
}

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Invoice)
    privateinvoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    privatepaymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    privateexpenseRepository: Repository<Expense>,
    @InjectRepository(ResidentBilling)
    privateresidentBillingRepository: Repository<ResidentBilling>,
    @InjectRepository(PayrollRun)
    privatepayrollRunRepository: Repository<PayrollRun>,
    @InjectRepository(Payslip)
    privatepayslipRepository: Repository<Payslip>,
  ) {}

  /**
   * Create a new invoice
   */
  async createInvoice(request: CreateInvoiceRequest, createdBy: string): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber();

    // Create invoice
    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      type: request.type,
      recipientName: request.recipientName,
      recipientAddress: request.recipientAddress,
      recipientPostcode: request.recipientPostcode,
      recipientEmail: request.recipientEmail,
      recipientPhone: request.recipientPhone,
      invoiceDate: request.invoiceDate,
      dueDate: request.dueDate,
      notes: request.notes,
      terms: request.terms,
      status: InvoiceStatus.DRAFT,
      createdBy,
      updatedBy: createdBy,
      residentBillingId: request.residentBillingId,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create line items
    let subtotal = 0;
    let taxAmount = 0;

    for (let i = 0; i < request.lineItems.length; i++) {
      const lineItem = request.lineItems[i];
      const lineTotal = lineItem.quantity * lineItem.unitPrice;
      const itemTaxRate = lineItem.taxRate || 20; // Default VAT rate
      const itemTaxAmount = lineTotal * (itemTaxRate / 100);

      subtotal += lineTotal;
      taxAmount += itemTaxAmount;

      // In a real implementation, you would create InvoiceLineItem entities here
      // For now, we'll calculate totals directly
    }

    // Update invoice totals
    invoice.subtotal = subtotal;
    invoice.taxAmount = taxAmount;
    invoice.totalAmount = subtotal + taxAmount;
    invoice.balanceAmount = invoice.totalAmount;

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Record a payment for an invoice
   */
  async recordPayment(request: RecordPaymentRequest, recordedBy: string): Promise<Payment> {
    // Find the invoice
    const invoice = await this.invoiceRepository.findOne({
      where: { id: request.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new Error('Invoice must be sent before payment can be recorded');
    }

    // Create payment
    const payment = this.paymentRepository.create({
      invoiceId: request.invoiceId,
      paymentReference: this.generatePaymentReference(),
      amount: request.amount,
      method: request.method,
      paymentDate: request.paymentDate,
      transactionId: request.transactionId,
      bankReference: request.bankReference,
      payerName: request.payerName,
      payerEmail: request.payerEmail,
      payerPhone: request.payerPhone,
      notes: request.notes,
      status: PaymentStatus.COMPLETED,
      processedAt: new Date(),
      netAmount: request.amount, // Assuming no processing fee for now
      createdBy: recordedBy,
      updatedBy: recordedBy,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice
    invoice.paidAmount += request.amount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidDate = new Date();
    }

    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  /**
   * Get all invoices with optional filters
   */
  async getInvoices(filters: {
    status?: InvoiceStatus;
    type?: InvoiceType;
    startDate?: Date;
    endDate?: Date;
    recipientName?: string;
    isOverdue?: boolean;
  } = {}): Promise<Invoice[]> {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('invoice.type = :type', { type: filters.type });
    }

    if (filters.startDate) {
      query.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.recipientName) {
      query.andWhere('invoice.recipientName ILIKE :recipientName', { 
        recipientName: `%${filters.recipientName}%` 
      });
    }

    if (filters.isOverdue) {
      query.andWhere('invoice.dueDate < :today', { today: new Date() });
      query.andWhere('invoice.status NOT IN (:...paidStatuses)', { 
        paidStatuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] 
      });
    }

    return await query
      .orderBy('invoice.invoiceDate', 'DESC')
      .getMany();
  }

  /**
   * Get all payments with optional filters
   */
  async getPayments(filters: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  } = {}): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice');

    if (filters.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.method) {
      query.andWhere('payment.method = :method', { method: filters.method });
    }

    if (filters.startDate) {
      query.andWhere('payment.paymentDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('payment.paymentDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.minAmount) {
      query.andWhere('payment.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      query.andWhere('payment.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    return await query
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<FinancialMetrics> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceDate BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate: now 
      })
      .getMany();

    const totalInvoices = invoices.length;
    const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
    const outstandingAmount = invoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0);
    const overdueAmount = invoices
      .filter(invoice => invoice.isOverdue())
      .reduce((sum, invoice) => sum + invoice.balanceAmount, 0);

    const averageInvoiceValue = totalInvoices > 0 ? totalInvoiceValue / totalInvoices : 0;
    const paymentRate = totalInvoiceValue > 0 ? (paidAmount / totalInvoiceValue) * 100 : 0;

    return {
      totalInvoices,
      totalInvoiceValue,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      averageInvoiceValue,
      paymentRate,
      monthlyRevenue: period === 'month' ? totalInvoiceValue : 0,
      quarterlyRevenue: period === 'quarter' ? totalInvoiceValue : 0,
      yearlyRevenue: period === 'year' ? totalInvoiceValue : 0,
    };
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.dueDate < :today', { today: new Date() })
      .andWhere('invoice.status NOT IN (:...paidStatuses)', { 
        paidStatuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] 
      })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Send invoice to recipient
   */
  async sendInvoice(invoiceId: string, sentBy: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be sent');
    }

    invoice.status = InvoiceStatus.SENT;
    invoice.sentDate = new Date();
    invoice.updatedBy = sentBy;

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Generate recurring invoices
   */
  async generateRecurringInvoices(): Promise<Invoice[]> {
    const residentBillings = await this.residentBillingRepository
      .createQueryBuilder('billing')
      .where('billing.isRecurring = true')
      .andWhere('billing.nextInvoiceDate <= :today', { today: new Date() })
      .getMany();

    constgeneratedInvoices: Invoice[] = [];

    for (const billing of residentBillings) {
      try {
        constinvoiceRequest: CreateInvoiceRequest = {
          type: InvoiceType.RESIDENT_BILLING,
          recipientName: billing.residentName,
          recipientAddress: billing.residentAddress,
          recipientEmail: billing.residentEmail,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          lineItems: billing.serviceCharges.map(charge => ({
            description: charge.description,
            quantity: 1,
            unitPrice: charge.amount,
            taxRate: 20, // VAT rate
          })),
          residentBillingId: billing.id,
        };

        const invoice = await this.createInvoice(invoiceRequest, 'system');
        generatedInvoices.push(invoice);

        // Update next invoice date
        billing.nextInvoiceDate = new Date(billing.nextInvoiceDate!.getTime() + billing.billingFrequency * 24 * 60 * 60 * 1000);
        billing.lastInvoiceDate = new Date();
        await this.residentBillingRepository.save(billing);

      } catch (error) {
        console.error(`Failed to generate recurring invoice for billing ${billing.id}:`, error);
      }
    }

    return generatedInvoices;
  }

  // Helper methods
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV${year}${month}${random}`;
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PAY${timestamp}${random}`;
  }
}

export default FinancialService;
