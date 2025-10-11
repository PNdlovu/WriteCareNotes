/**
 * @fileoverview io t wearables Service
 * @module External-integration/IoTWearablesService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description io t wearables Service
 */

import { EventEmitter2 } from 'eventemitter2';
import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { ExternalSystem, SystemType, IntegrationStatus } from '../../entities/external-integration/ExternalSystem';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { FieldLevelEncryptionService } from '../encryption/FieldLevelEncryptionService';

export interface IoTDevice {
  id: string;
  deviceType: 'wearable' | 'sensor' | 'monitor' | 'camera' | 'environmental';
  deviceModel: string;
  manufacturer: string;
  serialNumber: string;
  macAddress: string;
  firmwareVersion: string;
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: Date;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  location: {
    room: string;
    bed?: string;
    coordinates?: { x: number; y: number; z: number };
  };
  configuration: {
    samplingRate: number;
    thresholds: Record<string, { min: number; max: number }>;
    alerts: string[];
    dataRetention: number; // days
  };
  metadata: Record<string, any>;
}

export interface WearableData {
  deviceId: string;
  residentId: string;
  timestamp: string;
  dataType: 'vital_signs' | 'movement' | 'sleep' | 'activity' | 'location' | 'environmental';
  measurements: {
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    temperature?: number;
    oxygenSaturation?: number;
    steps?: number;
    calories?: number;
    distance?: number;
    sleepDuration?: number;
    sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    activityLevel?: 'low' | 'moderate' | 'high';
    location?: { x: number; y: number; z: number };
    room?: string;
    temperature?: number;
    humidity?: number;
    lightLevel?: number;
    noiseLevel?: number;
  };
  quality: {
    signalStrength: number;
    dataIntegrity: number;
    completeness: number;
  };
  metadata: {
    deviceModel: string;
    firmwareVersion: string;
    batteryLevel: number;
    processingTime: number;
  };
}

export interface AnomalyDetectionResult {
  anomalyId: string;
  deviceId: string;
  residentId: string;
  timestamp: string;
  anomalyType: 'vital_signs' | 'movement' | 'behavioral' | 'environmental' | 'device';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedMeasurements: string[];
  baselineValues: Record<string, number>;
  currentValues: Record<string, number>;
  deviationPercentage: number;
  confidence: number;
  recommendations: string[];
  requiresImmediateAction: boolean;
  metadata: {
    algorithm: string;
    modelVersion: string;
    processingTime: number;
  };
}

export interface DataTransformationRule {
  id: string;
  name: string;
  sourceDevice: string;
  targetFormat: string;
  transformations: Array<{
    field: string;
    operation: 'map' | 'convert' | 'calculate' | 'filter' | 'aggregate';
    parameters: Record<string, any>;
  }>;
  validation: {
    requiredFields: string[];
    dataTypes: Record<string, string>;
    ranges: Record<string, { min: number; max: number }>;
  };
  enabled: boolean;
}

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: number;
  timestamp: string;
  key: string;
  value: any;
  headers: Record<string, string>;
}

export interface IoTIntegrationConfig {
  kafka: {
    brokers: string[];
    topics: {
      rawData: string;
      processedData: string;
      anomalies: string;
      alerts: string;
    };
    consumer: {
      groupId: string;
      autoOffsetReset: 'earliest' | 'latest';
      enableAutoCommit: boolean;
    };
    producer: {
      acks: 'all' | '1' | '0';
      retries: number;
      batchSize: number;
    };
  };
  processing: {
    batchSize: number;
    processingInterval: number; // milliseconds
    maxRetries: number;
    deadLetterQueue: string;
  };
  storage: {
    retentionPeriod: number; // days
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

export class IoTWearablesService {
  privatesystemRepository: Repository<ExternalSystem>;
  privateauditService: AuditService;
  privatenotificationService: NotificationService;
  privateencryptionService: FieldLevelEncryptionService;
  privateeventEmitter: EventEmitter2;
  privateconfig: IoTIntegrationConfig;
  privatedevices: Map<string, IoTDevice> = new Map();
  privatetransformationRules: Map<string, DataTransformationRule> = new Map();

  constructor() {
    this.systemRepository = AppDataSource.getRepository(ExternalSystem);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService();
    this.encryptionService = new FieldLevelEncryptionService();
    this.eventEmitter = new EventEmitter2();
    
    // Initialize IoT integration configuration
    this.config = {
      kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        topics: {
          rawData: process.env.KAFKA_TOPIC_RAW_DATA || 'iot-raw-data',
          processedData: process.env.KAFKA_TOPIC_PROCESSED_DATA || 'iot-processed-data',
          anomalies: process.env.KAFKA_TOPIC_ANOMALIES || 'iot-anomalies',
          alerts: process.env.KAFKA_TOPIC_ALERTS || 'iot-alerts'
        },
        consumer: {
          groupId: process.env.KAFKA_CONSUMER_GROUP || 'iot-integration-service',
          autoOffsetReset: 'latest',
          enableAutoCommit: true
        },
        producer: {
          acks: 'all',
          retries: 3,
          batchSize: 16384
        }
      },
      processing: {
        batchSize: parseInt(process.env.IOT_BATCH_SIZE || '100'),
        processingInterval: parseInt(process.env.IOT_PROCESSING_INTERVAL || '5000'),
        maxRetries: 3,
        deadLetterQueue: 'iot-dead-letter-queue'
      },
      storage: {
        retentionPeriod: parseInt(process.env.IOT_RETENTION_DAYS || '90'),
        compressionEnabled: true,
        encryptionEnabled: true
      }
    };

    this.initializeTransformationRules();
  }

  /**
   * Initialize IoT integration system
   */
  async initializeIoTIntegration(): Promise<ExternalSystem> {
    try {
      // Check if IoT system already exists
      let system = await this.systemRepository.findOne({
        where: { systemType: SystemType.REGULATORY_SYSTEM }
      });

      if (!system) {
        // Create new IoT system
        system = this.systemRepository.create({
          systemId: 'IOT_WEARABLES_001',
          systemName: 'IoT & Wearables Integration',
          systemType: SystemType.REGULATORY_SYSTEM,
          status: IntegrationStatus.TESTING,
          connectionConfig: {
            endpoint: 'kafka://' + this.config.kafka.brokers.join(','),
            authentication: {
              type: 'sasl_plain',
              username: process.env.KAFKA_USERNAME || '',
              password: 'encrypted'
            },
            timeout: 30000,
            retryPolicy: {
              maxRetries: this.config.processing.maxRetries,
              backoffMs: 1000
            }
          },
          dataMapping: {
            inboundMappings: [
              { source: 'vital_signs.heart_rate', target: 'resident.vitalSigns.heartRate' },
              { source: 'vital_signs.blood_pressure', target: 'resident.vitalSigns.bloodPressure' },
              { source: 'movement.steps', target: 'resident.activity.steps' },
              { source: 'sleep.duration', target: 'resident.sleep.duration' }
            ],
            outboundMappings: [
              { source: 'resident.medications', target: 'device.medication_reminders' },
              { source: 'resident.appointments', target: 'device.appointment_reminders' }
            ],
            transformationRules: [
              { rule: 'normalizeHeartRate', source: 'heart_rate', target: 'normalized_heart_rate' },
              { rule: 'calculateActivityScore', source: 'steps', target: 'activity_score' }
            ]
          },
          totalTransactions: 0,
          failedTransactions: 0
        });

        system = await this.systemRepository.save(system);
      }

      // Start Kafka consumer
      await this.startKafkaConsumer();

      // Update status to active
      system.status = IntegrationStatus.ACTIVE;
      await this.systemRepository.save(system);

      await this.auditService.logEvent({
        resource: 'IoTWearables',
        entityType: 'ExternalSystem',
        entityId: system.id,
        action: 'INITIALIZE_IOT_INTEGRATION',
        details: { systemId: system.systemId, kafkaBrokers: this.config.kafka.brokers },
        userId: 'system'
      });

      return system;
    } catch (error) {
      console.error('Failed to initialize IoT integration:', error);
      throw new Error(`IoT integration initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register IoT device
   */
  async registerDevice(device: IoTDevice): Promise<void> {
    try {
      // Validate device
      this.validateDevice(device);

      // Encrypt sensitive data
      const encryptedDevice = {
        ...device,
        serialNumber: await this.encryptionService.encrypt(device.serialNumber),
        macAddress: await this.encryptionService.encrypt(device.macAddress)
      };

      // Store device
      this.devices.set(device.id, encryptedDevice);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'IoTDevice',
        entityType: 'IoTDevice',
        entityId: device.id,
        action: 'REGISTER_DEVICE',
        details: {
          deviceId: device.id,
          deviceType: device.deviceType,
          deviceModel: device.deviceModel,
          manufacturer: device.manufacturer
        },
        userId: 'system'
      });

      // Emit event
      this.eventEmitter.emit('iot.device.registered', {
        deviceId: device.id,
        deviceType: device.deviceType,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Device registration failed:', error);
      throw new Error(`Device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process raw IoT data
   */
  async processRawData(message: KafkaMessage): Promise<void> {
    try {
      // Parse message
      const rawData = JSON.parse(message.value);

      // Validate data
      this.validateRawData(rawData);

      // Transform data
      const transformedData = await this.transformData(rawData);

      // Detect anomalies
      const anomalies = await this.detectAnomalies(transformedData);

      // Store processed data
      await this.storeProcessedData(transformedData);

      // Handle anomalies
      if (anomalies.length > 0) {
        await this.handleAnomalies(anomalies);
      }

      // Emit event
      this.eventEmitter.emit('iot.data.processed', {
        deviceId: transformedData.deviceId,
        residentId: transformedData.residentId,
        dataType: transformedData.dataType,
        timestamp: transformedData.timestamp,
        anomalies: anomalies.length
      });

    } catch (error) {
      console.error('Raw data processing failed:', error);
      
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(message, error);
    }
  }

  /**
   * Transform data using transformation rules
   */
  private async transformData(rawData: any): Promise<WearableData> {
    try {
      const deviceId = rawData.deviceId;
      const rule = this.transformationRules.get(deviceId);

      if (!rule) {
        throw new Error(`No transformation rule found for device: ${deviceId}`);
      }

      let transformedData = { ...rawData };

      // Apply transformations
      for (const transformation of rule.transformations) {
        transformedData = await this.applyTransformation(transformedData, transformation);
      }

      // Validate transformed data
      this.validateTransformedData(transformedData, rule);

      return transformedData as WearableData;
    } catch (error) {
      console.error('Data transformation failed:', error);
      throw error;
    }
  }

  /**
   * Apply single transformation
   */
  private async applyTransformation(data: any, transformation: any): Promise<any> {
    switch (transformation.operation) {
      case 'map':
        return this.mapField(data, transformation);
      case 'convert':
        return this.convertField(data, transformation);
      case 'calculate':
        return this.calculateField(data, transformation);
      case 'filter':
        return this.filterData(data, transformation);
      case 'aggregate':
        return this.aggregateData(data, transformation);
      default:
        throw new Error(`Unknown transformation operation: ${transformation.operation}`);
    }
  }

  /**
   * Map field
   */
  private mapField(data: any, transformation: any): any {
    const { field, parameters } = transformation;
    const sourceField = parameters.sourceField || field;
    const targetField = parameters.targetField || field;

    if (data[sourceField] !== undefined) {
      data[targetField] = data[sourceField];
      if (sourceField !== targetField) {
        delete data[sourceField];
      }
    }

    return data;
  }

  /**
   * Convert field
   */
  private convertField(data: any, transformation: any): any {
    const { field, parameters } = transformation;
    const { targetType, conversionRule } = parameters;

    if (data[field] !== undefined) {
      switch (targetType) {
        case 'number':
          data[field] = parseFloat(data[field]);
          break;
        case 'integer':
          data[field] = parseInt(data[field]);
          break;
        case 'boolean':
          data[field] = Boolean(data[field]);
          break;
        case 'date':
          data[field] = new Date(data[field]).toISOString();
          break;
        case 'custom':
          data[field] = this.applyCustomConversion(data[field], conversionRule);
          break;
      }
    }

    return data;
  }

  /**
   * Calculate field
   */
  private calculateField(data: any, transformation: any): any {
    const { field, parameters } = transformation;
    const { formula, variables } = parameters;

    // Replace variables in formula with actual values
    let formulaWithValues = formula;
    for (const [varName, varField] of Object.entries(variables)) {
      const value = data[varField as string];
      if (value !== undefined) {
        formulaWithValues = formulaWithValues.replace(new RegExp(varName, 'g'), value.toString());
      }
    }

    // Evaluate formula (in real implementation, use a safe math evaluator)
    try {
      data[field] = eval(formulaWithValues);
    } catch (error) {
      console.error('Formula evaluation failed:', error);
      data[field] = 0;
    }

    return data;
  }

  /**
   * Filter data
   */
  private filterData(data: any, transformation: any): any {
    const { parameters } = transformation;
    const { conditions } = parameters;

    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const fieldValue = data[field];

      let shouldKeep = false;
      switch (operator) {
        case 'equals':
          shouldKeep = fieldValue === value;
          break;
        case 'not_equals':
          shouldKeep = fieldValue !== value;
          break;
        case 'greater_than':
          shouldKeep = fieldValue > value;
          break;
        case 'less_than':
          shouldKeep = fieldValue < value;
          break;
        case 'contains':
          shouldKeep = fieldValue && fieldValue.includes(value);
          break;
      }

      if (!shouldKeep) {
        return null; // Filter out this record
      }
    }

    return data;
  }

  /**
   * Aggregate data
   */
  private aggregateData(data: any, transformation: any): any {
    const { field, parameters } = transformation;
    const { operation, windowSize } = parameters;

    // In a real implementation, this would aggregate data over a time window
    // For now, we'll just return the data as-is
    return data;
  }

  /**
   * Apply custom conversion
   */
  private applyCustomConversion(value: any, conversionRule: string): any {
    // In a real implementation, this would apply custom conversion logic
    return value;
  }

  /**
   * Detect anomalies
   */
  private async detectAnomalies(data: WearableData): Promise<AnomalyDetectionResult[]> {
    constanomalies: AnomalyDetectionResult[] = [];

    try {
      // Check heart rate anomalies
      if (data.measurements.heartRate) {
        const heartRateAnomaly = this.detectHeartRateAnomaly(data);
        if (heartRateAnomaly) {
          anomalies.push(heartRateAnomaly);
        }
      }

      // Check blood pressure anomalies
      if (data.measurements.bloodPressure) {
        const bloodPressureAnomaly = this.detectBloodPressureAnomaly(data);
        if (bloodPressureAnomaly) {
          anomalies.push(bloodPressureAnomaly);
        }
      }

      // Check movement anomalies
      if (data.measurements.steps !== undefined) {
        const movementAnomaly = this.detectMovementAnomaly(data);
        if (movementAnomaly) {
          anomalies.push(movementAnomaly);
        }
      }

      // Check sleep anomalies
      if (data.measurements.sleepDuration !== undefined) {
        const sleepAnomaly = this.detectSleepAnomaly(data);
        if (sleepAnomaly) {
          anomalies.push(sleepAnomaly);
        }
      }

    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }

    return anomalies;
  }

  /**
   * Detect heart rate anomaly
   */
  private detectHeartRateAnomaly(data: WearableData): AnomalyDetectionResult | null {
    const heartRate = data.measurements.heartRate!;
    const normalRange = { min: 60, max: 100 };
    
    if (heartRate < normalRange.min || heartRate > normalRange.max) {
      return {
        anomalyId: `anomaly_${Date.now()}_hr`,
        deviceId: data.deviceId,
        residentId: data.residentId,
        timestamp: data.timestamp,
        anomalyType: 'vital_signs',
        severity: heartRate < 40 || heartRate > 150 ? 'critical' : 'medium',
        description: `Heart rate ${heartRate} bpm is outside normal range (${normalRange.min}-${normalRange.max} bpm)`,
        affectedMeasurements: ['heartRate'],
        baselineValues: { heartRate: 80 },
        currentValues: { heartRate },
        deviationPercentage: Math.abs(heartRate - 80) / 80 * 100,
        confidence: 0.85,
        recommendations: [
          'Check for medication side effects',
          'Monitor for signs of distress',
          'Consider medical review if persistent'
        ],
        requiresImmediateAction: heartRate < 40 || heartRate > 150,
        metadata: {
          algorithm: 'threshold_based',
          modelVersion: '1.0.0',
          processingTime: 5
        }
      };
    }

    return null;
  }

  /**
   * Detect blood pressure anomaly
   */
  private detectBloodPressureAnomaly(data: WearableData): AnomalyDetectionResult | null {
    const bp = data.measurements.bloodPressure!;
    const normalRange = { systolic: { min: 90, max: 140 }, diastolic: { min: 60, max: 90 } };
    
    if (bp.systolic < normalRange.systolic.min || bp.systolic > normalRange.systolic.max ||
        bp.diastolic < normalRange.diastolic.min || bp.diastolic > normalRange.diastolic.max) {
      return {
        anomalyId: `anomaly_${Date.now()}_bp`,
        deviceId: data.deviceId,
        residentId: data.residentId,
        timestamp: data.timestamp,
        anomalyType: 'vital_signs',
        severity: bp.systolic > 180 || bp.diastolic > 110 ? 'critical' : 'high',
        description: `Blood pressure ${bp.systolic}/${bp.diastolic} mmHg is outside normal range`,
        affectedMeasurements: ['bloodPressure'],
        baselineValues: { systolic: 120, diastolic: 80 },
        currentValues: { systolic: bp.systolic, diastolic: bp.diastolic },
        deviationPercentage: Math.abs(bp.systolic - 120) / 120 * 100,
        confidence: 0.90,
        recommendations: [
          'Check medication compliance',
          'Monitor for symptoms',
          'Consider immediate medical review if severe'
        ],
        requiresImmediateAction: bp.systolic > 180 || bp.diastolic > 110,
        metadata: {
          algorithm: 'threshold_based',
          modelVersion: '1.0.0',
          processingTime: 3
        }
      };
    }

    return null;
  }

  /**
   * Detect movement anomaly
   */
  private detectMovementAnomaly(data: WearableData): AnomalyDetectionResult | null {
    const steps = data.measurements.steps!;
    const expectedSteps = 5000; // Daily average
    
    if (steps < expectedSteps * 0.1) { // Less than 10% of expected
      return {
        anomalyId: `anomaly_${Date.now()}_movement`,
        deviceId: data.deviceId,
        residentId: data.residentId,
        timestamp: data.timestamp,
        anomalyType: 'movement',
        severity: 'medium',
        description: `Significantly reduced movement: ${steps} steps (expected: ${expectedSteps})`,
        affectedMeasurements: ['steps'],
        baselineValues: { steps: expectedSteps },
        currentValues: { steps },
        deviationPercentage: (expectedSteps - steps) / expectedSteps * 100,
        confidence: 0.75,
        recommendations: [
          'Check for mobility issues',
          'Encourage gentle movement',
          'Monitor for signs of illness'
        ],
        requiresImmediateAction: false,
        metadata: {
          algorithm: 'statistical_threshold',
          modelVersion: '1.0.0',
          processingTime: 2
        }
      };
    }

    return null;
  }

  /**
   * Detect sleep anomaly
   */
  private detectSleepAnomaly(data: WearableData): AnomalyDetectionResult | null {
    const sleepDuration = data.measurements.sleepDuration!;
    const expectedSleep = 8 * 60; // 8 hours in minutes
    
    if (sleepDuration < expectedSleep * 0.5) { // Less than 4 hours
      return {
        anomalyId: `anomaly_${Date.now()}_sleep`,
        deviceId: data.deviceId,
        residentId: data.residentId,
        timestamp: data.timestamp,
        anomalyType: 'behavioral',
        severity: 'medium',
        description: `Insufficient sleep: ${sleepDuration} minutes (expected: ${expectedSleep} minutes)`,
        affectedMeasurements: ['sleepDuration'],
        baselineValues: { sleepDuration: expectedSleep },
        currentValues: { sleepDuration },
        deviationPercentage: (expectedSleep - sleepDuration) / expectedSleep * 100,
        confidence: 0.80,
        recommendations: [
          'Check for sleep disturbances',
          'Review medication timing',
          'Consider sleep hygiene improvements'
        ],
        requiresImmediateAction: false,
        metadata: {
          algorithm: 'threshold_based',
          modelVersion: '1.0.0',
          processingTime: 2
        }
      };
    }

    return null;
  }

  /**
   * Handle anomalies
   */
  private async handleAnomalies(anomalies: AnomalyDetectionResult[]): Promise<void> {
    for (const anomaly of anomalies) {
      try {
        // Store anomaly
        await this.storeAnomaly(anomaly);

        // Send alert if required
        if (anomaly.requiresImmediateAction) {
          await this.sendImmediateAlert(anomaly);
        } else {
          await this.sendStandardAlert(anomaly);
        }

        // Emit event
        this.eventEmitter.emit('iot.anomaly.detected', {
          anomalyId: anomaly.anomalyId,
          deviceId: anomaly.deviceId,
          residentId: anomaly.residentId,
          anomalyType: anomaly.anomalyType,
          severity: anomaly.severity,
          timestamp: anomaly.timestamp
        });

      } catch (error) {
        console.error('Anomaly handling failed:', error);
      }
    }
  }

  /**
   * Store anomaly
   */
  private async storeAnomaly(anomaly: AnomalyDetectionResult): Promise<void> {
    // In a real implementation, this would store the anomaly in the database
    console.log('Storing anomaly:', anomaly.anomalyId);
  }

  /**
   * Send immediate alert
   */
  private async sendImmediateAlert(anomaly: AnomalyDetectionResult): Promise<void> {
    await this.notificationService.sendNotification({
      type: 'critical_alert',
      recipient: 'nursing_staff',
      title: 'Critical IoT Anomaly Detected',
      message: `${anomaly.description} - Immediate action required`,
      data: {
        anomalyId: anomaly.anomalyId,
        deviceId: anomaly.deviceId,
        residentId: anomaly.residentId,
        severity: anomaly.severity,
        recommendations: anomaly.recommendations
      }
    });
  }

  /**
   * Send standard alert
   */
  private async sendStandardAlert(anomaly: AnomalyDetectionResult): Promise<void> {
    await this.notificationService.sendNotification({
      type: 'iot_anomaly',
      recipient: 'care_staff',
      title: 'IoT Anomaly Detected',
      message: `${anomaly.description}`,
      data: {
        anomalyId: anomaly.anomalyId,
        deviceId: anomaly.deviceId,
        residentId: anomaly.residentId,
        severity: anomaly.severity,
        recommendations: anomaly.recommendations
      }
    });
  }

  /**
   * Store processed data
   */
  private async storeProcessedData(data: WearableData): Promise<void> {
    // In a real implementation, this would store the data in the database
    console.log('Storing processed data:', data.deviceId, data.dataType);
  }

  /**
   * Send to dead letter queue
   */
  private async sendToDeadLetterQueue(message: KafkaMessage, error: any): Promise<void> {
    // In a real implementation, this would send the message to a dead letter queue
    console.error('Sending to dead letter queue:', message.topic, error);
  }

  /**
   * Start Kafka consumer
   */
  private async startKafkaConsumer(): Promise<void> {
    // In a real implementation, this would start a Kafka consumer
    console.log('Starting Kafka consumer for IoT data...');
  }

  /**
   * Initialize transformation rules
   */
  private initializeTransformationRules(): void {
    // Add default transformation rules
    constdefaultRule: DataTransformationRule = {
      id: 'default_rule',
      name: 'Default IoT Data Transformation',
      sourceDevice: 'all',
      targetFormat: 'standard',
      transformations: [
        {
          field: 'timestamp',
          operation: 'convert',
          parameters: { targetType: 'date' }
        },
        {
          field: 'heartRate',
          operation: 'map',
          parameters: { sourceField: 'hr', targetField: 'heartRate' }
        }
      ],
      validation: {
        requiredFields: ['deviceId', 'residentId', 'timestamp', 'dataType'],
        dataTypes: {
          deviceId: 'string',
          residentId: 'string',
          timestamp: 'string',
          dataType: 'string'
        },
        ranges: {}
      },
      enabled: true
    };

    this.transformationRules.set('default_rule', defaultRule);
  }

  /**
   * Validate device
   */
  private validateDevice(device: IoTDevice): void {
    if (!device.id) {
      throw new Error('Device ID is required');
    }
    if (!device.deviceType) {
      throw new Error('Device type is required');
    }
    if (!device.deviceModel) {
      throw new Error('Device model is required');
    }
    if (!device.manufacturer) {
      throw new Error('Manufacturer is required');
    }
    if (!device.serialNumber) {
      throw new Error('Serial number is required');
    }
    if (!device.macAddress) {
      throw new Error('MAC address is required');
    }
  }

  /**
   * Validate raw data
   */
  private validateRawData(data: any): void {
    if (!data.deviceId) {
      throw new Error('Device ID is required');
    }
    if (!data.residentId) {
      throw new Error('Resident ID is required');
    }
    if (!data.timestamp) {
      throw new Error('Timestamp is required');
    }
    if (!data.dataType) {
      throw new Error('Data type is required');
    }
  }

  /**
   * Validate transformed data
   */
  private validateTransformedData(data: any, rule: DataTransformationRule): void {
    // Check required fields
    for (const field of rule.validation.requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Check data types
    for (const [field, expectedType] of Object.entries(rule.validation.dataTypes)) {
      if (data[field] !== undefined) {
        const actualType = typeof data[field];
        if (actualType !== expectedType) {
          throw new Error(`Field ${field} has wrong type: expected ${expectedType}, got ${actualType}`);
        }
      }
    }

    // Check ranges
    for (const [field, range] of Object.entries(rule.validation.ranges)) {
      if (data[field] !== undefined) {
        const value = data[field];
        if (value < range.min || value > range.max) {
          throw new Error(`Field ${field} value ${value} is outside range [${range.min}, ${range.max}]`);
        }
      }
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    status: IntegrationStatus;
    totalDevices: number;
    onlineDevices: number;
    totalDataPoints: number;
    anomaliesDetected: number;
  }> {
    try {
      const system = await this.systemRepository.findOne({
        where: { systemType: SystemType.REGULATORY_SYSTEM }
      });

      if (!system) {
        throw new Error('IoT integration system not found');
      }

      const onlineDevices = Array.from(this.devices.values()).filter(
        device => device.status === 'online'
      ).length;

      return {
        status: system.status,
        totalDevices: this.devices.size,
        onlineDevices,
        totalDataPoints: system.totalTransactions,
        anomaliesDetected: 0 // Would track in real implementation
      };
    } catch (error) {
      console.error('Failed to get integration status:', error);
      throw error;
    }
  }
}

export default IoTWearablesService;
