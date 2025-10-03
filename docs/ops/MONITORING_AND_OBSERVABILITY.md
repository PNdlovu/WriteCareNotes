# Monitoring and Observability Guide – WriteCareNotes

## Overview

This guide provides comprehensive documentation for monitoring, alerting, and observability across the WriteCareNotes care home management system. It covers system health monitoring, performance metrics, logging, and incident detection.

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Metrics and KPIs](#metrics-and-kpis)
3. [Alerting Configuration](#alerting-configuration)
4. [Logging Strategy](#logging-strategy)
5. [Dashboards](#dashboards)
6. [Incident Detection](#incident-detection)
7. [Performance Monitoring](#performance-monitoring)
8. [Security Monitoring](#security-monitoring)
9. [Compliance Monitoring](#compliance-monitoring)
10. [Troubleshooting](#troubleshooting)

## Monitoring Architecture

### Core Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation and analysis
- **PagerDuty**: Alert routing and escalation
- **Custom Health Checks**: Application-specific monitoring

### Data Flow

```
Applications → Metrics/Logs → Prometheus/ELK → Grafana → Alerts → PagerDuty
     ↓
Health Checks → Custom Monitors → AlertManager → Notifications
```

## Metrics and KPIs

### System Metrics

#### Infrastructure Metrics
- **CPU Usage**: < 70% average, < 90% peak
- **Memory Usage**: < 80% average, < 95% peak
- **Disk Usage**: < 85% average, < 95% peak
- **Network I/O**: Monitor for anomalies
- **Database Connections**: < 80% of pool size

#### Application Metrics
- **Response Time**: P95 < 500ms, P99 < 1000ms
- **Error Rate**: < 1% for 5xx errors
- **Throughput**: Requests per second
- **Availability**: > 99.9% uptime
- **Queue Depth**: Monitor job queues

### Business Metrics

#### Care Home Operations
- **Active Residents**: Current resident count
- **Staff On-Duty**: Current staff count
- **Occupancy Rate**: Percentage of capacity
- **Care Plan Updates**: Daily care plan modifications
- **Medication Administrations**: Daily medication doses

#### Compliance Metrics
- **Audit Trail Completeness**: 100% required
- **Data Retention Compliance**: Automated monitoring
- **Access Log Completeness**: 100% required
- **Consent Management**: Active consent tracking

### Healthcare-Specific Metrics

#### Clinical Metrics
- **Medication Compliance**: > 95% target
- **Care Plan Adherence**: > 90% target
- **Incident Response Time**: < 15 minutes
- **Assessment Completion**: > 95% on time

#### Quality Metrics
- **CQC Compliance Score**: Monitor regulatory compliance
- **Family Satisfaction**: Survey response rates
- **Staff Training Completion**: > 95% required
- **Documentation Accuracy**: > 98% target

## Alerting Configuration

### Alert Severity Levels

#### Critical (P1)
- **System Down**: Complete service outage
- **Data Loss**: Any data corruption or loss
- **Security Breach**: Unauthorized access detected
- **Patient Safety**: Any safety-critical system failure

#### High (P2)
- **Performance Degradation**: > 50% performance drop
- **High Error Rate**: > 5% error rate
- **Database Issues**: Connection pool exhaustion
- **Compliance Violation**: Regulatory compliance issues

#### Medium (P3)
- **Minor Performance Issues**: 20-50% performance drop
- **Elevated Error Rate**: 1-5% error rate
- **Resource Constraints**: High resource usage
- **Service Degradation**: Non-critical service issues

#### Low (P4)
- **Informational**: System status updates
- **Maintenance Windows**: Scheduled maintenance
- **Capacity Planning**: Resource usage trends

### Alert Rules

#### System Health Alerts
```yaml
# High CPU Usage
- alert: HighCPUUsage
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is above 80% for more than 5 minutes"

# High Memory Usage
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage detected"
    description: "Memory usage is above 85% for more than 5 minutes"

# Disk Space Critical
- alert: DiskSpaceCritical
  expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 90
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Disk space critical"
    description: "Disk usage is above 90%"
```

#### Application Health Alerts
```yaml
# High Error Rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
  for: 3m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 5% for more than 3 minutes"

# High Response Time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is above 1 second"

# Service Down
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service is down"
    description: "Service {{ $labels.instance }} is down"
```

#### Database Alerts
```yaml
# Database Connection Pool Exhaustion
- alert: DatabaseConnectionPoolExhaustion
  expr: db_connections_active / db_connections_max * 100 > 80
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Database connection pool near exhaustion"
    description: "Connection pool usage is above 80%"

# Slow Queries
- alert: SlowQueries
  expr: rate(db_query_duration_seconds{quantile="0.95"}[5m]) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Slow database queries detected"
    description: "95th percentile query time is above 2 seconds"
```

### Alert Routing

#### PagerDuty Integration
```yaml
# Critical alerts go to on-call engineer
- match:
    severity: critical
  receiver: pagerduty-critical

# High priority alerts go to backup engineer
- match:
    severity: warning
  receiver: pagerduty-warning

# Medium priority alerts go to team channel
- match:
    severity: info
  receiver: slack-team
```

## Logging Strategy

### Log Levels

#### Application Logs
- **ERROR**: System errors, exceptions, failures
- **WARN**: Warning conditions, degraded performance
- **INFO**: General information, business events
- **DEBUG**: Detailed debugging information
- **TRACE**: Very detailed tracing information

#### Audit Logs
- **AUDIT**: All data access and modifications
- **SECURITY**: Security-related events
- **COMPLIANCE**: Regulatory compliance events

### Log Format

#### Structured Logging
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "api-gateway",
  "version": "1.0.0",
  "traceId": "trace-123",
  "spanId": "span-456",
  "userId": "user-789",
  "careHomeId": "carehome-101",
  "message": "User authenticated successfully",
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "endpoint": "/api/auth/login",
    "responseTime": 150
  }
}
```

#### Healthcare-Specific Logging
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "AUDIT",
  "service": "medication-service",
  "eventType": "medication_administration",
  "residentId": "resident-123",
  "medicationId": "med-456",
  "administeredBy": "nurse-789",
  "witnessedBy": "nurse-101",
  "dosage": "500mg",
  "route": "oral",
  "status": "completed",
  "complianceFlags": ["on_time", "correct_dosage"],
  "metadata": {
    "vitalSigns": {
      "bloodPressure": "120/80",
      "heartRate": 72
    },
    "sideEffects": [],
    "notes": "Taken with breakfast"
  }
}
```

### Log Aggregation

#### ELK Stack Configuration
```yaml
# Elasticsearch
elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "writecarenotes-logs-%{+YYYY.MM.dd}"
  
# Logstash
logstash:
  input:
    beats:
      port: 5044
  filter:
    - grok:
        match:
          message: "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}"
    - date:
        match: ["timestamp", "ISO8601"]
  output:
    elasticsearch:
      hosts: ["elasticsearch:9200"]
      
# Kibana
kibana:
  host: "kibana:5601"
  index: "writecarenotes-logs-*"
```

## Dashboards

### System Overview Dashboard

#### Key Metrics
- **System Health**: Overall system status
- **Response Time**: P50, P95, P99 response times
- **Error Rate**: 4xx and 5xx error rates
- **Throughput**: Requests per second
- **Resource Usage**: CPU, memory, disk usage

#### Panels
```yaml
# Response Time Panel
- title: "API Response Time"
  type: "graph"
  targets:
    - expr: "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))"
      legendFormat: "P50"
    - expr: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
      legendFormat: "P95"
    - expr: "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
      legendFormat: "P99"

# Error Rate Panel
- title: "Error Rate"
  type: "graph"
  targets:
    - expr: "rate(http_requests_total{status=~\"4..\"}[5m])"
      legendFormat: "4xx Errors"
    - expr: "rate(http_requests_total{status=~\"5..\"}[5m])"
      legendFormat: "5xx Errors"
```

### Healthcare Operations Dashboard

#### Key Metrics
- **Active Residents**: Current resident count
- **Staff On-Duty**: Current staff count
- **Medication Compliance**: Compliance rates
- **Care Plan Updates**: Daily updates
- **Incident Reports**: Safety incidents

#### Panels
```yaml
# Resident Metrics Panel
- title: "Resident Metrics"
  type: "stat"
  targets:
    - expr: "sum(resident_count{status=\"active\"})"
      legendFormat: "Active Residents"
    - expr: "sum(resident_count{status=\"admitted_today\"})"
      legendFormat: "Admitted Today"
    - expr: "sum(resident_count{status=\"discharged_today\"})"
      legendFormat: "Discharged Today"

# Medication Compliance Panel
- title: "Medication Compliance"
  type: "gauge"
  targets:
    - expr: "medication_compliance_rate"
      legendFormat: "Compliance Rate"
      thresholds:
        - value: 95
          color: "green"
        - value: 90
          color: "yellow"
        - value: 0
          color: "red"
```

### Compliance Dashboard

#### Key Metrics
- **Audit Trail Completeness**: 100% target
- **Data Retention Compliance**: Automated monitoring
- **Access Control**: Permission violations
- **Consent Management**: Active consents

#### Panels
```yaml
# Compliance Metrics Panel
- title: "Compliance Metrics"
  type: "table"
  targets:
    - expr: "audit_trail_completeness"
      legendFormat: "Audit Trail"
    - expr: "data_retention_compliance"
      legendFormat: "Data Retention"
    - expr: "consent_management_active"
      legendFormat: "Active Consents"
```

## Incident Detection

### Automated Detection

#### Anomaly Detection
```python
# Example anomaly detection for response times
def detect_response_time_anomaly(metrics):
    current_avg = metrics['response_time_avg']
    historical_avg = metrics['response_time_historical_avg']
    threshold = 2.0  # 2x historical average
    
    if current_avg > historical_avg * threshold:
        return {
            'type': 'response_time_anomaly',
            'severity': 'warning',
            'current_value': current_avg,
            'expected_value': historical_avg,
            'deviation': (current_avg - historical_avg) / historical_avg
        }
    return None
```

#### Pattern Recognition
```python
# Example pattern recognition for error spikes
def detect_error_pattern(metrics):
    error_rate = metrics['error_rate_5m']
    error_rate_1h = metrics['error_rate_1h']
    
    # Detect sudden spike in errors
    if error_rate > error_rate_1h * 3:
        return {
            'type': 'error_spike',
            'severity': 'critical',
            'current_rate': error_rate,
            'baseline_rate': error_rate_1h
        }
    return None
```

### Manual Detection

#### Health Check Endpoints
```http
# System health check
GET /health

# Detailed health check
GET /health/detailed

# Readiness check
GET /health/ready

# Liveness check
GET /health/live
```

#### Custom Health Checks
```python
# Example custom health check
def check_database_health():
    try:
        # Check database connectivity
        db.execute("SELECT 1")
        
        # Check connection pool
        pool_usage = get_connection_pool_usage()
        if pool_usage > 0.8:
            return {"status": "degraded", "message": "High connection pool usage"}
        
        return {"status": "healthy", "message": "Database is healthy"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Database error: {str(e)}"}
```

## Performance Monitoring

### Application Performance

#### Key Performance Indicators
- **Response Time**: P50, P95, P99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Availability**: Uptime percentage

#### Performance Baselines
```yaml
# Response Time Baselines
response_time:
  p50: 200ms
  p95: 500ms
  p99: 1000ms
  
# Throughput Baselines
throughput:
  normal: 100 rps
  peak: 500 rps
  
# Error Rate Baselines
error_rate:
  normal: < 1%
  warning: 1-5%
  critical: > 5%
```

### Database Performance

#### Key Metrics
- **Query Performance**: Average query time
- **Connection Pool**: Active connections
- **Lock Contention**: Database locks
- **Index Usage**: Index efficiency

#### Database Monitoring Queries
```sql
-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Connection usage
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Lock contention
SELECT mode, count(*) 
FROM pg_locks 
GROUP BY mode;
```

## Security Monitoring

### Security Events

#### Authentication Events
- **Failed Login Attempts**: Brute force detection
- **Suspicious Activity**: Unusual access patterns
- **Privilege Escalation**: Permission changes
- **Session Anomalies**: Unusual session behavior

#### Data Access Events
- **Sensitive Data Access**: PII access logging
- **Bulk Data Exports**: Large data downloads
- **Unauthorized Access**: Permission violations
- **Data Modification**: Audit trail for changes

### Security Alerts

#### Brute Force Detection
```yaml
# Failed login attempts
- alert: BruteForceAttack
  expr: rate(auth_failed_attempts[5m]) > 10
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Potential brute force attack detected"
    description: "More than 10 failed login attempts in 5 minutes"
```

#### Suspicious Activity
```yaml
# Unusual access patterns
- alert: SuspiciousActivity
  expr: rate(data_access_events[1h]) > 1000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Suspicious data access activity"
    description: "High volume of data access events detected"
```

## Compliance Monitoring

### Regulatory Compliance

#### CQC Compliance
- **Audit Trail Completeness**: 100% required
- **Data Retention**: Automated compliance
- **Access Control**: Permission monitoring
- **Incident Reporting**: Safety incident tracking

#### GDPR Compliance
- **Data Subject Rights**: Request tracking
- **Consent Management**: Active consent monitoring
- **Data Minimization**: Data usage tracking
- **Breach Detection**: Security incident monitoring

### Compliance Dashboards

#### Audit Trail Dashboard
```yaml
# Audit Trail Completeness
- title: "Audit Trail Completeness"
  type: "gauge"
  targets:
    - expr: "audit_trail_completeness_percentage"
      legendFormat: "Completeness %"
      thresholds:
        - value: 100
          color: "green"
        - value: 95
          color: "yellow"
        - value: 0
          color: "red"
```

## Troubleshooting

### Common Issues

#### High Response Times
1. **Check Database Performance**
   ```bash
   # Check slow queries
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

2. **Check Resource Usage**
   ```bash
   # Check CPU and memory
   kubectl top pods -n writecarenotes
   ```

3. **Check Network Latency**
   ```bash
   # Check network connectivity
   kubectl exec -n writecarenotes deployment/api-gateway -- ping database.writecarenotes.svc.cluster.local
   ```

#### High Error Rates
1. **Check Application Logs**
   ```bash
   # Check error logs
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep ERROR
   ```

2. **Check Dependencies**
   ```bash
   # Check service health
   curl -s http://api-gateway.writecarenotes.svc.cluster.local/health
   ```

3. **Check Database Connectivity**
   ```bash
   # Check database status
   kubectl exec -n writecarenotes deployment/postgres -- pg_isready
   ```

### Monitoring Tools

#### Prometheus Queries
```promql
# Response time by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (endpoint)

# Error rate by service
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) by (service)

# Memory usage by pod
container_memory_usage_bytes / container_spec_memory_limit_bytes by (pod)
```

#### Grafana Dashboards
- **System Overview**: `/d/system-overview`
- **Application Metrics**: `/d/application-metrics`
- **Database Performance**: `/d/database-performance`
- **Healthcare Operations**: `/d/healthcare-operations`
- **Compliance Monitoring**: `/d/compliance-monitoring`

### Alert Response Procedures

#### Critical Alerts
1. **Acknowledge** alert in PagerDuty
2. **Assess** impact and severity
3. **Escalate** if needed
4. **Document** response actions
5. **Follow up** with post-incident review

#### Warning Alerts
1. **Monitor** for escalation
2. **Investigate** root cause
3. **Implement** preventive measures
4. **Update** monitoring rules if needed

---

## Document Control

**Version**: 1.0  
**Last Updated**: January 15, 2025  
**Next Review**: April 15, 2025  
**Approved By**: Technical Director  
**Distribution**: Engineering Team, Operations Team

**Change Log**:
- v1.0: Initial creation with comprehensive monitoring and observability procedures

---

*This monitoring guide is a living document and should be updated regularly to reflect changes in system architecture, monitoring tools, and best practices.*