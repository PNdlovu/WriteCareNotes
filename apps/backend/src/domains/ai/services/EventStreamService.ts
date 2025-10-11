import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareEvent } from '../entities/CareEvent';
import { EventStream } from '../entities/EventStream';
import { EventSubscription } from '../entities/EventSubscription';
import { AIAgent } from '../entities/AIAgent';
import { AIAgentRegistryService } from './AIAgentRegistryService';

export interface CareEventData {
  type: string;
  domain: string;
  entityId: string;
  data: any;
  timestamp: Date;
  context: {
    domainName: string;
    tenantId?: string;
    userId?: string;
    requestId?: string;
  };
}

export interface EventSubscriptionData {
  eventType: string;
  agentId: string;
  conditions?: any;
  priority: number;
  enabled: boolean;
}

export interface EventStreamConfig {
  name: string;
  description: string;
  eventTypes: string[];
  retentionDays: number;
  maxEvents: number;
}

@Injectable()
export class EventStreamService {
  private eventHandlers: Map<string, ((event: CareEventData) => Promise<void>)[]> = new Map();

  constructor(
    @InjectRepository(CareEvent)
    private careEventRepository: Repository<CareEvent>,
    @InjectRepository(EventStream)
    private eventStreamRepository: Repository<EventStream>,
    @InjectRepository(EventSubscription)
    private eventSubscriptionRepository: Repository<EventSubscription>,
    @InjectRepository(AIAgent)
    private agentRepository: Repository<AIAgent>,
    private registryService: AIAgentRegistryService,
  ) {}

  /**
   * Publish a care event
   */
  async publishEvent(eventData: CareEventData): Promise<CareEvent> {
    // Create care event
    const careEvent = this.careEventRepository.create({
      type: eventData.type,
      domain: eventData.domain,
      entityId: eventData.entityId,
      data: eventData.data,
      timestamp: eventData.timestamp,
      context: eventData.context,
      processed: false,
    });

    const savedEvent = await this.careEventRepository.save(careEvent);

    // Process event asynchronously
    this.processEvent(savedEvent).catch(error => {
      console.error('Error processing event:', error);
    });

    return savedEvent;
  }

  /**
   * Process a care event
   */
  private async processEvent(event: CareEvent): Promise<void> {
    try {
      // Find subscriptions for this event type
      const subscriptions = await this.eventSubscriptionRepository.find({
        where: { 
          eventType: event.type,
          enabled: true,
        },
        relations: ['agent'],
        order: { priority: 'DESC' },
      });

      // Process each subscription
      for (const subscription of subscriptions) {
        try {
          // Check if conditions are met
          if (this.evaluateConditions(subscription.conditions, event)) {
            await this.triggerAgent(subscription.agentId, event);
          }
        } catch (error) {
          console.error(`Error processing subscription ${subscription.id}:`, error);
        }
      }

      // Mark event as processed
      event.processed = true;
      event.processedAt = new Date();
      await this.careEventRepository.save(event);

    } catch (error) {
      console.error('Error processing event:', error);
      event.errorMessage = error.message;
      await this.careEventRepository.save(event);
    }
  }

  /**
   * Trigger an agent with an event
   */
  private async triggerAgent(agentId: string, event: CareEvent): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent || !agent.canAcceptNewSession()) {
      console.warn(`Agent ${agentId} is not available for event ${event.id}`);
      return;
    }

    try {
      // In a real implementation, this would send the event to the agent's endpoint
      console.log(`Triggering agent ${agent.name} with event ${event.type}`);
      
      // Simulate agent processing
      const startTime = Date.now();
      const success = Math.random() > 0.1; // 90% success rate
      const responseTime = (Date.now() - startTime) / 1000;

      // Update agent metrics
      await this.registryService.updateAgentMetrics(agentId, success, responseTime);

      if (!success) {
        throw new Error('Agent processing failed');
      }

    } catch (error) {
      console.error(`Error triggering agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate subscription conditions
   */
  private evaluateConditions(conditions: any, event: CareEvent): boolean {
    if (!conditions) return true;

    // Simple condition evaluation
    // In a real implementation, this would use a more sophisticated rule engine
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'domain' && event.domain !== value) return false;
      if (key === 'entityId' && event.entityId !== value) return false;
      if (key === 'data' && typeof value === 'object') {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          if (event.data[dataKey] !== dataValue) return false;
        }
      }
    }

    return true;
  }

  /**
   * Create event subscription
   */
  async createSubscription(data: EventSubscriptionData): Promise<EventSubscription> {
    const subscription = this.eventSubscriptionRepository.create({
      ...data,
      createdAt: new Date(),
    });

    return await this.eventSubscriptionRepository.save(subscription);
  }

  /**
   * Get subscriptions for an agent
   */
  async getAgentSubscriptions(agentId: string): Promise<EventSubscription[]> {
    return await this.eventSubscriptionRepository.find({
      where: { agentId },
      relations: ['agent'],
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get subscriptions for an event type
   */
  async getEventSubscriptions(eventType: string): Promise<EventSubscription[]> {
    return await this.eventSubscriptionRepository.find({
      where: { eventType, enabled: true },
      relations: ['agent'],
      order: { priority: 'DESC' },
    });
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, data: Partial<EventSubscriptionData>): Promise<EventSubscription> {
    const subscription = await this.eventSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error(`Subscription with ID '${subscriptionId}' not found`);
    }

    Object.assign(subscription, data);
    return await this.eventSubscriptionRepository.save(subscription);
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.eventSubscriptionRepository.delete(subscriptionId);
  }

  /**
   * Create event stream
   */
  async createEventStream(config: EventStreamConfig): Promise<EventStream> {
    const stream = this.eventStreamRepository.create({
      ...config,
      createdAt: new Date(),
    });

    return await this.eventStreamRepository.save(stream);
  }

  /**
   * Get events from stream
   */
  async getEventsFromStream(
    streamName: string,
    filters?: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<CareEvent[]> {
    const query = this.careEventRepository
      .createQueryBuilder('event')
      .leftJoin('event.stream', 'stream')
      .where('stream.name = :streamName', { streamName });

    if (filters?.eventType) {
      query.andWhere('event.type = :eventType', { eventType: filters.eventType });
    }

    if (filters?.startDate) {
      query.andWhere('event.timestamp >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('event.timestamp <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return await query
      .orderBy('event.timestamp', 'DESC')
      .getMany();
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(period: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const events = await this.careEventRepository
      .createQueryBuilder('event')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate: now 
      })
      .getMany();

    const stats = {
      totalEvents: events.length,
      processedEvents: events.filter(e => e.processed).length,
      failedEvents: events.filter(e => e.errorMessage).length,
      eventTypes: {},
      domains: {},
      averageProcessingTime: 0,
    };

    // Calculate event type distribution
    events.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
      stats.domains[event.domain] = (stats.domains[event.domain] || 0) + 1;
    });

    // Calculate average processing time
    const processedEvents = events.filter(e => e.processed && e.processedAt);
    if (processedEvents.length > 0) {
      const totalTime = processedEvents.reduce((sum, event) => {
        return sum + (event.processedAt!.getTime() - event.timestamp.getTime());
      }, 0);
      stats.averageProcessingTime = totalTime / processedEvents.length;
    }

    return stats;
  }

  /**
   * Add event handler
   */
  addEventHandler(eventType: string, handler: (event: CareEventData) => Promise<void>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventHandler(eventType: string, handler: (event: CareEventData) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get event handler count
   */
  getEventHandlerCount(eventType: string): number {
    const handlers = this.eventHandlers.get(eventType);
    return handlers ? handlers.length : 0;
  }

  /**
   * Clean up old events
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.careEventRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}

export default EventStreamService;