import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './Invoice';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CASH = 'cash',
  CHEQUE = 'cheque',
  DIRECT_DEBIT = 'direct_debit',
  STANDING_ORDER = 'standing_order',
  ONLINE = 'online',
  MOBILE = 'mobile'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  paymentReference: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankReference: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payerName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  payerEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payerPhone: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  processingFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netAmount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processedBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public generatePaymentReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PAY${timestamp}${random}`;
  }

  public calculateNetAmount(): void {
    this.netAmount = this.amount - this.processingFee;
  }

  public markAsCompleted(transactionId?: string, bankReference?: string): void {
    this.status = PaymentStatus.COMPLETED;
    this.processedAt = new Date();
    if (transactionId) this.transactionId = transactionId;
    if (bankReference) this.bankReference = bankReference;
    this.calculateNetAmount();
  }

  public markAsFailed(reason: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = reason;
    this.processedAt = new Date();
  }

  public markAsRefunded(): void {
    this.status = PaymentStatus.REFUNDED;
    this.processedAt = new Date();
  }

  public isSuccessful(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  public isPending(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING;
  }

  public isFailed(): boolean {
    return this.status === PaymentStatus.FAILED || this.status === PaymentStatus.CANCELLED;
  }

  public canBeRefunded(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  public getProcessingTime(): number | null {
    if (!this.processedAt) return null;
    return this.processedAt.getTime() - this.createdAt.getTime();
  }

  public getPaymentSummary(): {
    reference: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    date: Date;
    netAmount: number;
    processingFee: number;
  } {
    return {
      reference: this.paymentReference,
      amount: this.amount,
      currency: this.currency,
      method: this.method,
      status: this.status,
      date: this.paymentDate,
      netAmount: this.netAmount,
      processingFee: this.processingFee,
    };
  }
}