import Stripe from 'stripe';
import { logger } from '../../utils/logger';
import PrometheusService from '../monitoring/PrometheusService';
import SentryService from '../monitoring/SentryService';

interface PaymentIntent {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  customerId: string;
  dueDate: string;
  paidAt?: string;
  metadata: Record<string, string>;
}

interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  paymentIntentId: string;
  metadata: Record<string, string>;
}

/**
 * Payment Gateway Service
 * Provides integration with Stripe for payment processing
 */
export class PaymentGatewayService {
  private static instance: PaymentGatewayService;
  private stripe: Stripe;
  private prometheusService: PrometheusService;
  private sentryService: SentryService;

  private constructor() {
    this.prometheusService = PrometheusService.getInstance();
    this.sentryService = SentryService.getInstance();
    
    this.stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
      apiVersion: '2025-09-30.clover',
      typescript: true
    });
  }

  public static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'gbp',
    metadata: Record<string, string> = {},
    customerId?: string,
    organizationId?: string
  ): Promise<PaymentIntent> {
    try {
      const startTime = Date.now();
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency,
        metadata: {
          ...metadata,
          organizationId: organizationId || 'default',
          timestamp: new Date().toISOString()
        },
        customer: customerId,
        automatic_payment_methods: {
          enabled: true
        },
        confirmation_method: 'manual',
        confirm: false
      });

      const duration = Date.now() - startTime;
      
      // Record metrics
      this.prometheusService.recordExternalAPICall(
        'Stripe',
        'payment_intents',
        'POST',
        200,
        duration,
        organizationId
      );

      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        organizationId
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'create_payment_intent',
        amount,
        currency,
        organizationId
      });

      logger.error('Failed to create payment intent', { error, amount, currency, organizationId });
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
    organizationId?: string
  ): Promise<PaymentIntent> {
    try {
      const startTime = Date.now();
      
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      const duration = Date.now() - startTime;
      
      // Record metrics
      this.prometheusService.recordExternalAPICall(
        'Stripe',
        'payment_intents/confirm',
        'POST',
        200,
        duration,
        organizationId
      );

      logger.info('Payment intent confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
        organizationId
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'confirm_payment_intent',
        paymentIntentId,
        organizationId
      });

      logger.error('Failed to confirm payment intent', { error, paymentIntentId, organizationId });
      throw error;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(
    email: string,
    name?: string,
    organizationId?: string,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          organizationId: organizationId || 'default'
        }
      });

      logger.info('Customer created', {
        customerId: customer.id,
        email,
        organizationId
      });

      return customer.id;
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'create_customer',
        email,
        organizationId
      });

      logger.error('Failed to create customer', { error, email, organizationId });
      throw error;
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(
    type: string,
    card?: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    },
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
      };
    },
    organizationId?: string
  ): Promise<PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: type as any,
        card,
        billing_details: billingDetails
      });

      logger.info('Payment method created', {
        paymentMethodId: paymentMethod.id,
        type,
        organizationId
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        } : undefined,
        billingDetails: {
          name: paymentMethod.billing_details.name || undefined,
          email: paymentMethod.billing_details.email || undefined,
          phone: paymentMethod.billing_details.phone || undefined,
          address: paymentMethod.billing_details.address ? {
            line1: paymentMethod.billing_details.address.line1 || '',
            line2: paymentMethod.billing_details.address.line2 || undefined,
            city: paymentMethod.billing_details.address.city || '',
            state: paymentMethod.billing_details.address.state || undefined,
            postalCode: paymentMethod.billing_details.address.postal_code || '',
            country: paymentMethod.billing_details.address.country || ''
          } : undefined
        }
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'create_payment_method',
        type,
        organizationId
      });

      logger.error('Failed to create payment method', { error, type, organizationId });
      throw error;
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    customerId: string,
    amount: number,
    currency: string = 'gbp',
    description: string,
    metadata: Record<string, string> = {},
    organizationId?: string
  ): Promise<Invoice> {
    try {
      // Create invoice items first, then create invoice
      const invoiceItem = await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(amount * 100), // Convert to pence
        currency,
        description
      });

      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        metadata: {
          ...metadata,
          organizationId: organizationId || 'default'
        },
        auto_advance: false
      });

      logger.info('Invoice created', {
        invoiceId: invoice.id,
        customerId,
        amount,
        organizationId
      });

      return {
        id: invoice.id,
        number: invoice.number!,
        status: invoice.status!,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        customerId: invoice.customer as string,
        dueDate: new Date(invoice.due_date! * 1000).toISOString(),
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : undefined,
        metadata: invoice.metadata || {}
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'create_invoice',
        customerId,
        amount,
        organizationId
      });

      logger.error('Failed to create invoice', { error, customerId, amount, organizationId });
      throw error;
    }
  }

  /**
   * Process a refund
   */
  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
    metadata: Record<string, string> = {},
    organizationId?: string
  ): Promise<Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to pence
        reason: reason as any,
        metadata: {
          ...metadata,
          organizationId: organizationId || 'default'
        }
      });

      logger.info('Refund processed', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        organizationId
      });

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status || 'unknown',
        reason: refund.reason || undefined,
        paymentIntentId: refund.payment_intent as string,
        metadata: refund.metadata || {}
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'process_refund',
        paymentIntentId,
        amount,
        organizationId
      });

      logger.error('Failed to process refund', { error, paymentIntentId, amount, organizationId });
      throw error;
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string, organizationId?: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      logger.info('Payment intent retrieved', {
        paymentIntentId,
        status: paymentIntent.status,
        organizationId
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'get_payment_intent',
        paymentIntentId,
        organizationId
      });

      logger.error('Failed to retrieve payment intent', { error, paymentIntentId, organizationId });
      throw error;
    }
  }

  /**
   * List payment intents for a customer
   */
  async listPaymentIntents(
    customerId?: string,
    limit: number = 10,
    organizationId?: string
  ): Promise<PaymentIntent[]> {
    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        customer: customerId,
        limit
      });

      logger.info('Payment intents listed', {
        customerId,
        count: paymentIntents.data.length,
        organizationId
      });

      return paymentIntents.data.map(intent => ({
        id: intent.id,
        clientSecret: intent.client_secret!,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        metadata: intent.metadata
      }));
    } catch (error) {
      this.sentryService.captureException(error as Error, {
        service: 'Stripe',
        operation: 'list_payment_intents',
        customerId,
        organizationId
      });

      logger.error('Failed to list payment intents', { error, customerId, organizationId });
      throw error;
    }
  }

  /**
   * Health check for Stripe API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.balance.retrieve();
      return true;
    } catch (error) {
      logger.error('Stripe API health check failed', { error });
      return false;
    }
  }
}

export default PaymentGatewayService;