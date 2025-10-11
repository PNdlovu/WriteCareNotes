/**
 * @fileoverview EventStore Service for WriteCareNotes Healthcare Event Sourcing
 * @module EventStoreService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides event sourcing capabilities for healthcare microservices
 * with immutable event storage, replay functionality, and healthcare compliance.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements immutable event storage for audit compliance
 * - Follows GDPR data protection requirements
 * - Includes comprehensive audit trail for all events
 */

import { EventStoreDBClient, jsonEvent, JSONEventType, ResolvedEvent } from '@eventstore/db-client';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

export interface HealthcareEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventVersion: number;
  timestamp: Date;
  tenantId: string;
  userId?: string;
  correlationId: string;
  payload: Record<string, any>;
  metadata: {
    source: string;
    causationId?: string;
    complianceFlags: string[];
    healthcareContext?: string;
    regulatoryRelevance?: string[];
  };
}

export interface EventStoreSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  tenantId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface EventReplayOptions {
  fromVersion?: number;
  toVersion?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  eventTypes?: string[];
  tenantId?: string;
}

export class EventStoreService {
  privateclient: EventStoreDBClient;
  privatelogger: Logger;

  constructor() {
    this.client = EventStoreDBClient.connectionString(
      process.env.EVENTSTORE_CONNECTION_STRING || 
      'esdb://eventstore.event-store.svc.cluster.local:2113?tls=false'
    );
    this.logger = new Logger('EventStoreService');
  }

  /**
   * Appends a healthcare event to the event store
   */
  async appendEvent(
    streamName: string,
    event: HealthcareEvent,
    expectedVersion?: number
  ): Promise<void> {
    try {
      const eventData = jsonEvent({
        type: event.eventType,
        data: {
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          eventVersion: event.eventVersion,
          timestamp: event.timestamp.toISOString(),
          tenantId: event.tenantId,
          userId: event.userId,
          correlationId: event.correlationId,
          payload: event.payload,
          metadata: event.metadata
        },
        metadata: {
          correlationId: event.correlationId,
          tenantId: event.tenantId,
          timestamp: event.timestamp.toISOString(),
          complianceLevel: this.determineComplianceLevel(event),
          healthcareContext: event.metadata.healthcareContext
        }
      });

      await this.client.appendToStream(
        streamName,
        eventData,
        {
          expectedRevision: expectedVersion !== undefined ? BigInt(expectedVersion) : 'any'
        }
      );

      this.logger.info('Event appended to stream', {
        streamName,
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        correlationId: event.correlationId,
        tenantId: event.tenantId
      });

      // Publish to healthcare analytics if relevant
      if (this.isHealthcareAnalyticsRelevant(event)) {
        await this.publishToAnalytics(event);
      }

    } catch (error) {
      this.logger.error('Failed to append event to stream', {
        streamName,
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      });
      throw new Error(`Failed to append event: ${error.message}`);
    }
  }

  /**
   * Reads events from a stream with healthcare filtering
   */
  async readStream(
    streamName: string,
    options: EventReplayOptions = {}
  ): Promise<HealthcareEvent[]> {
    try {
      constevents: HealthcareEvent[] = [];
      
      constreadOptions: any = {
        direction: 'forwards',
        fromRevision: options.fromVersion ? BigInt(options.fromVersion) : 'start',
        maxCount: 1000
      };

      const eventStream = this.client.readStream(streamName, readOptions);

      for await (const resolvedEvent of eventStream) {
        if (resolvedEvent.event) {
          const healthcareEvent = this.mapToHealthcareEvent(resolvedEvent);
          
          // Apply healthcare-specific filters
          if (this.matchesHealthcareFilters(healthcareEvent, options)) {
            events.push(healthcareEvent);
          }
        }
      }

      this.logger.info('Events read from stream', {
        streamName,
        eventCount: events.length,
        tenantId: options.tenantId
      });

      return events;

    } catch (error) {
      this.logger.error('Failed to read events from stream', {
        streamName,
        error: error.message
      });
      throw new Error(`Failed to read stream: ${error.message}`);
    }
  }

  /**
   * Creates a snapshot of an aggregate for performance optimization
   */
  async createSnapshot(snapshot: EventStoreSnapshot): Promise<void> {
    try {
      const snapshotStreamName = `snapshot-${snapshot.aggregateType}-${snapshot.aggregateId}`;
      
      const snapshotEvent = jsonEvent({
        type: 'AggregateSnapshot',
        data: {
          aggregateId: snapshot.aggregateId,
          aggregateType: snapshot.aggregateType,
          version: snapshot.version,
          tenantId: snapshot.tenantId,
          data: snapshot.data,
          timestamp: snapshot.timestamp.toISOString()
        },
        metadata: {
          tenantId: snapshot.tenantId,
          timestamp: snapshot.timestamp.toISOString(),
          snapshotVersion: snapshot.version
        }
      });

      await this.client.appendToStream(snapshotStreamName, snapshotEvent);

      this.logger.info('Snapshot created', {
        aggregateId: snapshot.aggregateId,
        aggregateType: snapshot.aggregateType,
        version: snapshot.version,
        tenantId: snapshot.tenantId
      });

    } catch (error) {
      this.logger.error('Failed to create snapshot', {
        aggregateId: snapshot.aggregateId,
        error: error.message
      });
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
  }

  /**
   * Reads the latest snapshot for an aggregate
   */
  async readSnapshot(
    aggregateType: string,
    aggregateId: string,
    tenantId: string
  ): Promise<EventStoreSnapshot | null> {
    try {
      const snapshotStreamName = `snapshot-${aggregateType}-${aggregateId}`;
      
      const eventStream = this.client.readStream(snapshotStreamName, {
        direction: 'backwards',
        fromRevision: 'end',
        maxCount: 1
      });

      for await (const resolvedEvent of eventStream) {
        if (resolvedEvent.event && resolvedEvent.event.type === 'AggregateSnapshot') {
          const eventData = resolvedEvent.event.data as any;
          
          // Verify tenant isolation
          if (eventData.tenantId !== tenantId) {
            this.logger.warn('Tenant mismatch in snapshot access', {
              requestedTenantId: tenantId,
              snapshotTenantId: eventData.tenantId,
              aggregateId
            });
            return null;
          }

          return {
            aggregateId: eventData.aggregateId,
            aggregateType: eventData.aggregateType,
            version: eventData.version,
            tenantId: eventData.tenantId,
            data: eventData.data,
            timestamp: new Date(eventData.timestamp)
          };
        }
      }

      return null;

    } catch (error) {
      this.logger.error('Failed to read snapshot', {
        aggregateType,
        aggregateId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Replays events for healthcare compliance auditing
   */
  async replayEventsForCompliance(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    regulatoryFramework?: string
  ): Promise<HealthcareEvent[]> {
    try {
      constevents: HealthcareEvent[] = [];
      
      // Read from all healthcare streams
      const healthcareStreams = [
        'resident-events',
        'medication-events',
        'care-plan-events',
        'assessment-events',
        'compliance-events',
        'audit-events'
      ];

      for (const streamName of healthcareStreams) {
        try {
          const streamEvents = await this.readStream(streamName, {
            fromTimestamp: fromDate,
            toTimestamp: toDate,
            tenantId
          });

          // Filter by regulatory framework if specified
          const filteredEvents = regulatoryFramework
            ? streamEvents.filter(event => 
                event.metadata.regulatoryRelevance?.includes(regulatoryFramework)
              )
            : streamEvents;

          events.push(...filteredEvents);
        } catch (streamError) {
          // Stream might not exist, continue with other streams
          this.logger.warn('Stream not found during compliance replay', {
            streamName,
            error: streamError.message
          });
        }
      }

      // Sort by timestamp for chronological replay
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      this.logger.info('Compliance event replay completed', {
        tenantId,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        regulatoryFramework,
        eventCount: events.length
      });

      return events;

    } catch (error) {
      this.logger.error('Failed to replay events for compliance', {
        tenantId,
        regulatoryFramework,
        error: error.message
      });
      throw new Error(`Failed to replay compliance events: ${error.message}`);
    }
  }

  /**
   * Creates healthcare-specific event streams
   */
  async initializeHealthcareStreams(tenantId: string): Promise<void> {
    try {
      const healthcareStreams = [
        `resident-events-${tenantId}`,
        `medication-events-${tenantId}`,
        `care-plan-events-${tenantId}`,
        `assessment-events-${tenantId}`,
        `compliance-events-${tenantId}`,
        `audit-events-${tenantId}`,
        `nhs-integration-events-${tenantId}`
      ];

      for (const streamName of healthcareStreams) {
        // Create stream metadata for healthcare compliance
        const streamMetadata = {
          maxAge: 7 * 365 * 24 * 60 * 60, // 7 years for healthcare compliance
          maxCount: 1000000,
          acl: {
            readRoles: [`healthcare-staff-${tenantId}`, `compliance-officers-${tenantId}`],
            writeRoles: [`healthcare-services-${tenantId}`],
            deleteRoles: [`administrators-${tenantId}`],
            metaReadRoles: [`compliance-officers-${tenantId}`],
            metaWriteRoles: [`administrators-${tenantId}`]
          },
          customMetadata: {
            tenantId,
            complianceLevel: 'healthcare',
            regulatoryFrameworks: ['CQC', 'Care Inspectorate', 'CIW', 'RQIA', 'GDPR'],
            dataRetentionYears: 7,
            encryptionRequired: true
          }
        };

        await this.client.setStreamMetadata(streamName, streamMetadata);
      }

      this.logger.info('Healthcare streams initialized', {
        tenantId,
        streamCount: healthcareStreams.length
      });

    } catch (error) {
      this.logger.error('Failed to initialize healthcare streams', {
        tenantId,
        error: error.message
      });
      throw new Error(`Failed to initialize healthcare streams: ${error.message}`);
    }
  }

  /**
   * Maps EventStore resolved event to healthcare event
   */
  private mapToHealthcareEvent(resolvedEvent: ResolvedEvent): HealthcareEvent {
    const eventData = resolvedEvent.event!.data as any;
    
    return {
      eventId: eventData.eventId,
      eventType: resolvedEvent.event!.type,
      aggregateId: eventData.aggregateId,
      aggregateType: eventData.aggregateType,
      eventVersion: eventData.eventVersion,
      timestamp: new Date(eventData.timestamp),
      tenantId: eventData.tenantId,
      userId: eventData.userId,
      correlationId: eventData.correlationId,
      payload: eventData.payload,
      metadata: eventData.metadata
    };
  }

  /**
   * Determines compliance level for healthcare events
   */
  private determineComplianceLevel(event: HealthcareEvent): string {
    const criticalEventTypes = [
      'MedicationAdministered',
      'ComplianceViolationDetected',
      'ResidentAdmitted',
      'ResidentDischarged',
      'ControlledSubstanceDispensed'
    ];

    if (criticalEventTypes.includes(event.eventType)) {
      return 'critical';
    }

    if (event.metadata.complianceFlags.length > 0) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Checks if event is relevant for healthcare analytics
   */
  private isHealthcareAnalyticsRelevant(event: HealthcareEvent): boolean {
    const analyticsEventTypes = [
      'MedicationAdministered',
      'ResidentAdmitted',
      'AssessmentCompleted',
      'CarePlanUpdated',
      'ComplianceViolationDetected'
    ];

    return analyticsEventTypes.includes(event.eventType);
  }

  /**
   * Publishes event to healthcare analytics stream
   */
  private async publishToAnalytics(event: HealthcareEvent): Promise<void> {
    try {
      const analyticsStreamName = `healthcare-analytics-${event.tenantId}`;
      
      constanalyticsEvent: HealthcareEvent = {
        ...event,
        eventId: uuidv4(),
        eventType: `${event.eventType}Analytics`,
        metadata: {
          ...event.metadata,
          source: 'EventStoreService',
          causationId: event.eventId,
          complianceFlags: [...event.metadata.complianceFlags, 'analytics']
        }
      };

      await this.appendEvent(analyticsStreamName, analyticsEvent);

    } catch (error) {
      this.logger.warn('Failed to publish to analytics', {
        originalEventId: event.eventId,
        error: error.message
      });
      // Don't throw - analytics failure shouldn't break main event storage
    }
  }

  /**
   * Applies healthcare-specific filters to events
   */
  private matchesHealthcareFilters(
    event: HealthcareEvent,
    options: EventReplayOptions
  ): boolean {
    // Tenant isolation
    if (options.tenantId && event.tenantId !== options.tenantId) {
      return false;
    }

    // Event type filter
    if (options.eventTypes && !options.eventTypes.includes(event.eventType)) {
      return false;
    }

    // Timestamp filters
    if (options.fromTimestamp && event.timestamp < options.fromTimestamp) {
      return false;
    }

    if (options.toTimestamp && event.timestamp > options.toTimestamp) {
      return false;
    }

    return true;
  }

  /**
   * Closes the EventStore connection
   */
  async close(): Promise<void> {
    try {
      await this.client.dispose();
      this.logger.info('EventStore connection closed');
    } catch (error) {
      this.logger.error('Failed to close EventStore connection', {
        error: error.message
      });
    }
  }
}

export default EventStoreService;
