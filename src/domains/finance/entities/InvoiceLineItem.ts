import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './Invoice';

export enum LineItemType {
  SERVICE = 'service',
  PRODUCT = 'product',
  MEDICATION = 'medication',
  EQUIPMENT = 'equipment',
  THERAPY = 'therapy',
  MAINTENANCE = 'maintenance',
  OTHER = 'other'
}

@Entity('invoice_line_items')
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, invoice => invoice.lineItems)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ type: 'enum', enum: LineItemType })
  type: LineItemType;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serviceCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string; // e.g., "hours", "days", "each", "kg"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number; // VAT rate

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateLineTotal(): void {
    // Calculate line total before discount
    this.lineTotal = this.quantity * this.unitPrice;

    // Calculate discount amount
    this.discountAmount = this.lineTotal * (this.discountPercentage / 100);

    // Calculate line total after discount
    const discountedTotal = this.lineTotal - this.discountAmount;

    // Calculate tax
    this.taxAmount = discountedTotal * (this.taxRate / 100);

    // Calculate total amount including tax
    this.totalAmount = discountedTotal + this.taxAmount;
  }

  public setQuantity(quantity: number): void {
    this.quantity = quantity;
    this.calculateLineTotal();
  }

  public setUnitPrice(unitPrice: number): void {
    this.unitPrice = unitPrice;
    this.calculateLineTotal();
  }

  public setDiscountPercentage(percentage: number): void {
    this.discountPercentage = percentage;
    this.calculateLineTotal();
  }

  public setTaxRate(rate: number): void {
    this.taxRate = rate;
    this.calculateLineTotal();
  }

  public getLineItemSummary(): {
    id: string;
    lineNumber: number;
    type: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  } {
    return {
      id: this.id,
      lineNumber: this.lineNumber,
      type: this.type,
      description: this.description,
      quantity: this.quantity,
      unit: this.unit || '',
      unitPrice: this.unitPrice,
      lineTotal: this.lineTotal,
      discountAmount: this.discountAmount,
      taxAmount: this.taxAmount,
      totalAmount: this.totalAmount,
      currency: this.currency,
    };
  }

  public isService(): boolean {
    return this.type === LineItemType.SERVICE || this.type === LineItemType.THERAPY;
  }

  public isProduct(): boolean {
    return this.type === LineItemType.PRODUCT || this.type === LineItemType.MEDICATION || this.type === LineItemType.EQUIPMENT;
  }

  public hasDiscount(): boolean {
    return this.discountPercentage > 0 || this.discountAmount > 0;
  }

  public getDiscountAmount(): number {
    if (this.discountPercentage > 0) {
      return this.lineTotal * (this.discountPercentage / 100);
    }
    return this.discountAmount;
  }

  public getNetAmount(): number {
    return this.lineTotal - this.getDiscountAmount();
  }

  public getGrossAmount(): number {
    return this.getNetAmount() + this.taxAmount;
  }
}