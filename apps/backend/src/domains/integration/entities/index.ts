// Integration Domain - External System Integration Entities
export { default as Integration } from './Integration';
export { default as IntegrationConfig } from './IntegrationConfig';
export { default as IntegrationCredential } from './IntegrationCredential';
export { default as IntegrationMapping } from './IntegrationMapping';
export { default as IntegrationLog } from './IntegrationLog';

// NHS Integration
export { default as NHSConnection } from './NHSConnection';
export { default as GPConnectSession } from './GPConnectSession';
export { default as NHSPatientLink } from './NHSPatientLink';
export { default as DSCRSession } from './DSCRSession';

// IoT & Sensors
export { default as IoTDevice } from './IoTDevice';
export { default as SensorData } from './SensorData';
export { default as DeviceReading } from './DeviceReading';
export { default as AnomalyDetection } from './AnomalyDetection';

// Telehealth
export { default as TelehealthSession } from './TelehealthSession';
export { default as VideoConsultation } from './VideoConsultation';
export { default as RemoteMonitoring } from './RemoteMonitoring';

// Third-party Integrations
export { default as CRMIntegration } from './CRMIntegration';
export { default as AccountingIntegration } from './AccountingIntegration';
export { default as LocalAuthorityIntegration } from './LocalAuthorityIntegration';

// Integration Marketplace
export { default as ConnectorTemplate } from './ConnectorTemplate';
export { default as ConnectorInstance } from './ConnectorInstance';
export { default as ConnectorConfiguration } from './ConnectorConfiguration';
