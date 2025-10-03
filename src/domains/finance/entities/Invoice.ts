import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './Payment';
import { InvoiceLineItem } from './InvoiceLineItem';
import { ResidentBilling } from './ResidentBilling';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum InvoiceType {
  RESIDENT_BILLING = 'resident_billing',
  SERVICE_CHARGE = 'service_charge',
  ADDITIONAL_SERVICE = 'additional_service',
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  EQUIPMENT = 'equipment',
  MAINTENANCE = 'maintenance'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ type: 'enum', enum: InvoiceType })
  type: InvoiceType;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'varchar', length: 100 })
  recipientName: string;

  @Column({ type: 'varchar', length: 200 })
  recipientAddress: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPostcode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string;

  @Column({ type: 'date' })
  invoiceDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  sentDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number; // VAT rate

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balanceAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];

  @OneToMany(() => InvoiceLineItem, lineItem => lineItem.invoice)
  lineItems: InvoiceLineItem[];

  @ManyToOne(() => ResidentBilling, billing => billing.invoices)
  @JoinColumn({ name: 'residentBillingId' })
  residentBilling: ResidentBilling;

  @Column({ type: 'uuid', nullable: true })
  residentBillingId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTotals(): void {
    // Calculate subtotal from line items
    this.subtotal = this.lineItems?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;

    // Calculate tax
    this.taxAmount = this.subtotal * (this.taxRate / 100);

    // Calculate total
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;

    // Calculate balance
    this.balanceAmount = this.totalAmount - this.paidAmount;
  }

  public generateInvoiceNumber(): string {
    const year = this.invoiceDate.getFullYear();
    const month = String(this.invoiceDate.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV${year}${month}${random}`;
  }

  public isOverdue(): boolean {
    if (this.status === InvoiceStatus.PAID || this.status === InvoiceStatus.CANCELLED) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  public canBePaid(): boolean {
    return this.status === InvoiceStatus.SENT || this.status === InvoiceStatus.OVERDUE;
  }

  public canBeCancelled(): boolean {
    return this.status === InvoiceStatus.DRAFT || this.status === InvoiceStatus.SENT;
  }

  public markAsSent(): void {
    this.status = InvoiceStatus.SENT;
    this.sentDate = new Date();
  }

  public markAsPaid(): void {
    this.status = InvoiceStatus.PAID;
    this.paidDate = new Date();
  }

  public markAsOverdue(): void {
    if (this.isOverdue() && this.status === InvoiceStatus.SENT) {
      this.status = InvoiceStatus.OVERDUE;
    }
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getPaymentStatus(): {
    status: string;
    percentage: number;
    daysOverdue: number;
  } {
    const percentage = this.totalAmount > 0 ? (this.paidAmount / this.totalAmount) * 100 : 0;
    const daysOverdue = this.getDaysOverdue();

    let status = 'pending';
    if (this.status === InvoiceStatus.PAID) status = 'paid';
    else if (this.status === InvoiceStatus.OVERDUE) status = 'overdue';
    else if (this.status === InvoiceStatus.CANCELLED) status = 'cancelled';
    else if (this.status === InvoiceStatus.DISPUTED) status = 'disputed';
    else if (percentage > 0) status = 'partial';

    return { status, percentage, daysOverdue };
  }
}