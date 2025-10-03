# Troubleshooting Guide – WriteCareNotes

## Overview

This comprehensive troubleshooting guide provides step-by-step procedures for diagnosing and resolving common issues in the WriteCareNotes care home management system. It covers system-level problems, application issues, database problems, and healthcare-specific troubleshooting.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [System Issues](#system-issues)
3. [Application Issues](#application-issues)
4. [Database Issues](#database-issues)
5. [Network Issues](#network-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Healthcare-Specific Issues](#healthcare-specific-issues)
9. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
10. [Emergency Procedures](#emergency-procedures)

## Quick Reference

### Emergency Contacts
- **Primary On-Call**: [PHONE] / [EMAIL]
- **Secondary On-Call**: [PHONE] / [EMAIL]
- **Engineering Manager**: [PHONE] / [EMAIL]
- **Database Administrator**: [PHONE] / [EMAIL]

### Critical Commands
```bash
# Check system status
kubectl get pods -n writecarenotes

# Check logs
kubectl logs -n writecarenotes deployment/[service-name] --tail=100

# Check health
curl -s http://api-gateway.writecarenotes.svc.cluster.local/health

# Check database
kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT 1;"
```

### Severity Levels
- **P1 - Critical**: System down, data loss, security breach
- **P2 - High**: Major functionality unavailable, performance severely degraded
- **P3 - Medium**: Minor functionality issues, performance degradation
- **P4 - Low**: Cosmetic issues, enhancement requests

## System Issues

### Service Unavailable

#### Symptoms
- HTTP 503 Service Unavailable errors
- Connection refused errors
- Service not responding to health checks

#### Diagnosis Steps
1. **Check Pod Status**
   ```bash
   kubectl get pods -n writecarenotes
   kubectl describe pod [pod-name] -n writecarenotes
   ```

2. **Check Service Endpoints**
   ```bash
   kubectl get endpoints -n writecarenotes
   kubectl get services -n writecarenotes
   ```

3. **Check Resource Usage**
   ```bash
   kubectl top pods -n writecarenotes
   kubectl top nodes
   ```

#### Resolution Steps
1. **Restart Service**
   ```bash
   kubectl rollout restart deployment/[service-name] -n writecarenotes
   ```

2. **Scale Service**
   ```bash
   kubectl scale deployment [service-name] -n writecarenotes --replicas=3
   ```

3. **Check Resource Limits**
   ```bash
   kubectl describe pod [pod-name] -n writecarenotes | grep -A 5 "Limits:"
   ```

#### Common Causes
- Resource exhaustion (CPU/Memory)
- Database connection issues
- Configuration errors
- Network connectivity problems

### High CPU Usage

#### Symptoms
- Slow response times
- System unresponsive
- High CPU metrics in monitoring

#### Diagnosis Steps
1. **Check CPU Usage**
   ```bash
   kubectl top pods -n writecarenotes
   kubectl exec -n writecarenotes [pod-name] -- top
   ```

2. **Check Process Details**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- ps aux --sort=-%cpu
   ```

3. **Check Application Logs**
   ```bash
   kubectl logs -n writecarenotes [pod-name] --tail=100 | grep -i "cpu\|memory\|performance"
   ```

#### Resolution Steps
1. **Scale Horizontally**
   ```bash
   kubectl scale deployment [service-name] -n writecarenotes --replicas=5
   ```

2. **Increase Resource Limits**
   ```bash
   kubectl patch deployment [service-name] -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"[container-name]","resources":{"limits":{"cpu":"2","memory":"4Gi"}}}]}}}}'
   ```

3. **Optimize Application**
   - Check for infinite loops
   - Review database queries
   - Optimize algorithms

### High Memory Usage

#### Symptoms
- Out of memory errors
- Pod restarts
- Slow performance

#### Diagnosis Steps
1. **Check Memory Usage**
   ```bash
   kubectl top pods -n writecarenotes
   kubectl exec -n writecarenotes [pod-name] -- free -h
   ```

2. **Check Memory Details**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- cat /proc/meminfo
   ```

3. **Check for Memory Leaks**
   ```bash
   kubectl logs -n writecarenotes [pod-name] --tail=100 | grep -i "memory\|leak\|oom"
   ```

#### Resolution Steps
1. **Increase Memory Limits**
   ```bash
   kubectl patch deployment [service-name] -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"[container-name]","resources":{"limits":{"memory":"8Gi"}}}]}}}}'
   ```

2. **Restart Service**
   ```bash
   kubectl rollout restart deployment/[service-name] -n writecarenotes
   ```

3. **Check for Memory Leaks**
   - Review application code
   - Check for unclosed resources
   - Monitor garbage collection

### Disk Space Issues

#### Symptoms
- Disk full errors
- Log rotation failures
- Database connection issues

#### Diagnosis Steps
1. **Check Disk Usage**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- df -h
   ```

2. **Check Large Files**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- find / -type f -size +100M 2>/dev/null
   ```

3. **Check Log Files**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- du -sh /var/log/*
   ```

#### Resolution Steps
1. **Clean Log Files**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- find /var/log -name "*.log" -mtime +7 -delete
   ```

2. **Clean Temporary Files**
   ```bash
   kubectl exec -n writecarenotes [pod-name] -- rm -rf /tmp/*
   ```

3. **Increase Disk Space**
   - Scale persistent volumes
   - Clean up old data
   - Implement log rotation

## Application Issues

### API Errors

#### 500 Internal Server Error

##### Symptoms
- HTTP 500 errors in logs
- Application crashes
- User requests failing

##### Diagnosis Steps
1. **Check Application Logs**
   ```bash
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "error\|exception\|fatal"
   ```

2. **Check Database Connectivity**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- curl -s http://postgres.writecarenotes.svc.cluster.local:5432
   ```

3. **Check Dependencies**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- curl -s http://redis.writecarenotes.svc.cluster.local:6379/ping
   ```

##### Resolution Steps
1. **Restart Application**
   ```bash
   kubectl rollout restart deployment/api-gateway -n writecarenotes
   ```

2. **Check Configuration**
   ```bash
   kubectl get configmap api-gateway-config -n writecarenotes -o yaml
   ```

3. **Check Environment Variables**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- env | grep -i "db\|redis\|api"
   ```

#### 401 Unauthorized

##### Symptoms
- Authentication failures
- Token validation errors
- User login issues

##### Diagnosis Steps
1. **Check Authentication Service**
   ```bash
   kubectl logs -n writecarenotes deployment/auth-service --tail=100 | grep -i "auth\|token\|jwt"
   ```

2. **Check JWT Secret**
   ```bash
   kubectl get secret jwt-secret -n writecarenotes -o yaml
   ```

3. **Check Token Validity**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- curl -H "Authorization: Bearer [token]" http://localhost:3000/auth/verify
   ```

##### Resolution Steps
1. **Restart Auth Service**
   ```bash
   kubectl rollout restart deployment/auth-service -n writecarenotes
   ```

2. **Regenerate JWT Secret**
   ```bash
   kubectl create secret generic jwt-secret --from-literal=secret=$(openssl rand -base64 32) -n writecarenotes --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Clear Redis Sessions**
   ```bash
   kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHDB
   ```

#### 403 Forbidden

##### Symptoms
- Permission denied errors
- Access control failures
- Role-based access issues

##### Diagnosis Steps
1. **Check User Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- curl -H "Authorization: Bearer [token]" http://localhost:3000/auth/permissions
   ```

2. **Check Role Configuration**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM roles WHERE name = '[role-name]';"
   ```

3. **Check Access Control Logs**
   ```bash
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "forbidden\|permission\|access"
   ```

##### Resolution Steps
1. **Update User Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "UPDATE user_roles SET role_id = '[role-id]' WHERE user_id = '[user-id]';"
   ```

2. **Check Resource Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM resource_permissions WHERE resource = '[resource-name]';"
   ```

### Slow Response Times

#### Symptoms
- High response time metrics
- User complaints about slowness
- Timeout errors

#### Diagnosis Steps
1. **Check Response Time Metrics**
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s http://api-gateway.writecarenotes.svc.cluster.local/health
   ```

2. **Check Database Performance**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

3. **Check Network Latency**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- ping postgres.writecarenotes.svc.cluster.local
   ```

#### Resolution Steps
1. **Optimize Database Queries**
   - Add database indexes
   - Optimize query performance
   - Check for N+1 queries

2. **Scale Services**
   ```bash
   kubectl scale deployment api-gateway -n writecarenotes --replicas=5
   ```

3. **Enable Caching**
   - Implement Redis caching
   - Add CDN for static content
   - Optimize database queries

## Database Issues

### Connection Pool Exhaustion

#### Symptoms
- Database connection errors
- "Too many connections" errors
- Application timeouts

#### Diagnosis Steps
1. **Check Connection Pool Status**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
   ```

2. **Check Connection Limits**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SHOW max_connections;"
   ```

3. **Check Application Connection Pool**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- env | grep -i "db_pool\|connection"
   ```

#### Resolution Steps
1. **Increase Connection Pool Size**
   ```bash
   kubectl patch deployment api-gateway -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"DB_POOL_SIZE","value":"20"}]}]}}}}'
   ```

2. **Increase Database Connections**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "ALTER SYSTEM SET max_connections = 200;"
   ```

3. **Restart Services**
   ```bash
   kubectl rollout restart deployment/api-gateway -n writecarenotes
   kubectl rollout restart deployment/postgres -n writecarenotes
   ```

### Slow Queries

#### Symptoms
- High database CPU usage
- Slow application response
- Database timeout errors

#### Diagnosis Steps
1. **Check Slow Queries**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

2. **Check Database Locks**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT mode, count(*) FROM pg_locks GROUP BY mode;"
   ```

3. **Check Index Usage**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
   ```

#### Resolution Steps
1. **Add Database Indexes**
   ```sql
   CREATE INDEX CONCURRENTLY idx_residents_status ON residents(status);
   CREATE INDEX CONCURRENTLY idx_medications_resident_id ON medications(resident_id);
   ```

2. **Optimize Queries**
   - Use EXPLAIN ANALYZE to identify bottlenecks
   - Add appropriate WHERE clauses
   - Use LIMIT for large result sets

3. **Update Statistics**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "ANALYZE;"
   ```

### Database Corruption

#### Symptoms
- Data integrity errors
- Application crashes
- Inconsistent data

#### Diagnosis Steps
1. **Check Database Integrity**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "VACUUM ANALYZE;"
   ```

2. **Check for Corruption**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM pg_stat_database WHERE datname = 'writecarenotes';"
   ```

3. **Check Log Files**
   ```bash
   kubectl logs -n writecarenotes deployment/postgres --tail=100 | grep -i "error\|corrupt\|fatal"
   ```

#### Resolution Steps
1. **Restore from Backup**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "DROP DATABASE writecarenotes;"
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -c "CREATE DATABASE writecarenotes;"
   kubectl exec -n writecarenotes deployment/postgres -- pg_restore -U writecarenotes -d writecarenotes /backup/writecarenotes_backup.sql
   ```

2. **Repair Database**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "REINDEX DATABASE writecarenotes;"
   ```

3. **Contact Database Administrator**
   - Escalate to DBA team
   - Provide detailed error logs
   - Coordinate recovery procedures

## Network Issues

### DNS Resolution Problems

#### Symptoms
- Service discovery failures
- Connection refused errors
- Inter-service communication issues

#### Diagnosis Steps
1. **Check DNS Resolution**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- nslookup postgres.writecarenotes.svc.cluster.local
   ```

2. **Check Service Discovery**
   ```bash
   kubectl get services -n writecarenotes
   kubectl get endpoints -n writecarenotes
   ```

3. **Check Network Policies**
   ```bash
   kubectl get networkpolicies -n writecarenotes
   ```

#### Resolution Steps
1. **Restart DNS Service**
   ```bash
   kubectl rollout restart deployment/coredns -n kube-system
   ```

2. **Check Service Configuration**
   ```bash
   kubectl describe service postgres -n writecarenotes
   ```

3. **Update Network Policies**
   ```bash
   kubectl apply -f network-policies.yaml
   ```

### Network Latency

#### Symptoms
- Slow inter-service communication
- High response times
- Timeout errors

#### Diagnosis Steps
1. **Check Network Latency**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- ping postgres.writecarenotes.svc.cluster.local
   ```

2. **Check Network Throughput**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- iperf3 -c postgres.writecarenotes.svc.cluster.local
   ```

3. **Check Network Configuration**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- ip route
   ```

#### Resolution Steps
1. **Optimize Network Configuration**
   - Check for network bottlenecks
   - Optimize service mesh configuration
   - Update network policies

2. **Scale Services**
   ```bash
   kubectl scale deployment api-gateway -n writecarenotes --replicas=3
   ```

3. **Contact Network Team**
   - Escalate to network administrators
   - Provide network diagnostics
   - Coordinate network optimization

## Performance Issues

### Memory Leaks

#### Symptoms
- Gradually increasing memory usage
- Application crashes
- Out of memory errors

#### Diagnosis Steps
1. **Check Memory Usage Over Time**
   ```bash
   kubectl top pods -n writecarenotes --containers
   ```

2. **Check Memory Details**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- cat /proc/meminfo
   ```

3. **Check Application Logs**
   ```bash
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "memory\|leak\|gc"
   ```

#### Resolution Steps
1. **Restart Application**
   ```bash
   kubectl rollout restart deployment/api-gateway -n writecarenotes
   ```

2. **Increase Memory Limits**
   ```bash
   kubectl patch deployment api-gateway -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
   ```

3. **Optimize Application Code**
   - Review memory usage patterns
   - Fix memory leaks
   - Optimize garbage collection

### CPU Spikes

#### Symptoms
- High CPU usage
- Slow response times
- System unresponsive

#### Diagnosis Steps
1. **Check CPU Usage**
   ```bash
   kubectl top pods -n writecarenotes
   ```

2. **Check Process Details**
   ```bash
   kubectl exec -n writecarenotes deployment/api-gateway -- ps aux --sort=-%cpu
   ```

3. **Check Application Logs**
   ```bash
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "cpu\|performance\|slow"
   ```

#### Resolution Steps
1. **Scale Services**
   ```bash
   kubectl scale deployment api-gateway -n writecarenotes --replicas=5
   ```

2. **Optimize Application Code**
   - Review CPU-intensive operations
   - Optimize algorithms
   - Add caching

3. **Increase CPU Limits**
   ```bash
   kubectl patch deployment api-gateway -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"cpu":"2"}}}]}}}}'
   ```

## Security Issues

### Authentication Failures

#### Symptoms
- Login failures
- Token validation errors
- Access denied errors

#### Diagnosis Steps
1. **Check Authentication Service**
   ```bash
   kubectl logs -n writecarenotes deployment/auth-service --tail=100 | grep -i "auth\|login\|token"
   ```

2. **Check JWT Configuration**
   ```bash
   kubectl get secret jwt-secret -n writecarenotes -o yaml
   ```

3. **Check User Database**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM users WHERE email = '[email]';"
   ```

#### Resolution Steps
1. **Restart Auth Service**
   ```bash
   kubectl rollout restart deployment/auth-service -n writecarenotes
   ```

2. **Regenerate JWT Secret**
   ```bash
   kubectl create secret generic jwt-secret --from-literal=secret=$(openssl rand -base64 32) -n writecarenotes --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Reset User Password**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "UPDATE users SET password = '[hashed_password]' WHERE email = '[email]';"
   ```

### Authorization Issues

#### Symptoms
- Permission denied errors
- Access control failures
- Role-based access issues

#### Diagnosis Steps
1. **Check User Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT u.email, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.email = '[email]';"
   ```

2. **Check Resource Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM resource_permissions WHERE resource = '[resource]';"
   ```

3. **Check Access Control Logs**
   ```bash
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "forbidden\|permission\|access"
   ```

#### Resolution Steps
1. **Update User Role**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "UPDATE user_roles SET role_id = '[role_id]' WHERE user_id = '[user_id]';"
   ```

2. **Update Resource Permissions**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "INSERT INTO resource_permissions (resource, role_id, permission) VALUES ('[resource]', '[role_id]', '[permission]');"
   ```

3. **Clear Permission Cache**
   ```bash
   kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHDB
   ```

## Healthcare-Specific Issues

### Medication Administration Errors

#### Symptoms
- Medication administration failures
- Compliance tracking issues
- Safety alerts

#### Diagnosis Steps
1. **Check Medication Service**
   ```bash
   kubectl logs -n writecarenotes deployment/medication-service --tail=100 | grep -i "medication\|admin\|error"
   ```

2. **Check Medication Database**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM medications WHERE resident_id = '[resident_id]' AND status = 'active';"
   ```

3. **Check Administration Records**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM medication_administrations WHERE medication_id = '[medication_id]' ORDER BY administered_at DESC LIMIT 10;"
   ```

#### Resolution Steps
1. **Restart Medication Service**
   ```bash
   kubectl rollout restart deployment/medication-service -n writecarenotes
   ```

2. **Update Medication Status**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "UPDATE medications SET status = 'active' WHERE id = '[medication_id]';"
   ```

3. **Notify Clinical Team**
   - Contact nursing staff
   - Update care plans
   - Document incident

### Care Plan Issues

#### Symptoms
- Care plan not updating
- Assessment failures
- Compliance tracking issues

#### Diagnosis Steps
1. **Check Care Planning Service**
   ```bash
   kubectl logs -n writecarenotes deployment/care-planning-service --tail=100 | grep -i "care_plan\|assessment\|error"
   ```

2. **Check Care Plan Database**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM care_plans WHERE resident_id = '[resident_id]' AND status = 'active';"
   ```

3. **Check Assessment Records**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM assessments WHERE care_plan_id = '[care_plan_id]' ORDER BY created_at DESC LIMIT 10;"
   ```

#### Resolution Steps
1. **Restart Care Planning Service**
   ```bash
   kubectl rollout restart deployment/care-planning-service -n writecarenotes
   ```

2. **Update Care Plan Status**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "UPDATE care_plans SET status = 'active' WHERE id = '[care_plan_id]';"
   ```

3. **Notify Care Team**
   - Contact care managers
   - Update resident records
   - Schedule reassessment

### Compliance Issues

#### Symptoms
- Audit trail gaps
- Compliance violations
- Regulatory alerts

#### Diagnosis Steps
1. **Check Audit Service**
   ```bash
   kubectl logs -n writecarenotes deployment/audit-service --tail=100 | grep -i "audit\|compliance\|violation"
   ```

2. **Check Audit Database**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '1 hour';"
   ```

3. **Check Compliance Rules**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT * FROM compliance_rules WHERE status = 'active';"
   ```

#### Resolution Steps
1. **Restart Audit Service**
   ```bash
   kubectl rollout restart deployment/audit-service -n writecarenotes
   ```

2. **Fix Audit Trail Gaps**
   ```bash
   kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "INSERT INTO audit_logs (event_type, entity_type, entity_id, user_id, timestamp) VALUES ('[event_type]', '[entity_type]', '[entity_id]', '[user_id]', NOW());"
   ```

3. **Notify Compliance Team**
   - Contact compliance officers
   - Update regulatory reports
   - Document corrective actions

## Monitoring and Diagnostics

### Health Check Endpoints

#### System Health
```bash
# Overall system health
curl -s http://api-gateway.writecarenotes.svc.cluster.local/health

# Detailed health check
curl -s http://api-gateway.writecarenotes.svc.cluster.local/health/detailed

# Readiness check
curl -s http://api-gateway.writecarenotes.svc.cluster.local/health/ready

# Liveness check
curl -s http://api-gateway.writecarenotes.svc.cluster.local/health/live
```

#### Service Health
```bash
# Database health
curl -s http://postgres.writecarenotes.svc.cluster.local:5432/health

# Redis health
curl -s http://redis.writecarenotes.svc.cluster.local:6379/ping

# Authentication service health
curl -s http://auth-service.writecarenotes.svc.cluster.local/health
```

### Log Analysis

#### Application Logs
```bash
# Get recent errors
kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "error\|exception\|fatal"

# Get performance logs
kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "performance\|slow\|timeout"

# Get security logs
kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -i "security\|auth\|permission"
```

#### Database Logs
```bash
# Get database errors
kubectl logs -n writecarenotes deployment/postgres --tail=100 | grep -i "error\|fatal\|panic"

# Get slow query logs
kubectl logs -n writecarenotes deployment/postgres --tail=100 | grep -i "slow\|query\|performance"
```

### Metrics Analysis

#### Prometheus Queries
```promql
# Response time by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (endpoint)

# Error rate by service
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) by (service)

# Memory usage by pod
container_memory_usage_bytes / container_spec_memory_limit_bytes by (pod)

# CPU usage by pod
rate(container_cpu_usage_seconds_total[5m]) by (pod)
```

#### Grafana Dashboards
- **System Overview**: `/d/system-overview`
- **Application Metrics**: `/d/application-metrics`
- **Database Performance**: `/d/database-performance`
- **Healthcare Operations**: `/d/healthcare-operations`

## Emergency Procedures

### Critical System Outage

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert**
   - Respond to PagerDuty alert
   - Create incident channel in Slack
   - Notify stakeholders

2. **Assess Impact**
   - Check system status
   - Identify affected services
   - Estimate recovery time

3. **Begin Recovery**
   - Follow runbook procedures
   - Document all actions
   - Update stakeholders

#### Escalation (5-15 minutes)
1. **Escalate if Needed**
   - Contact secondary on-call
   - Notify engineering manager
   - Update incident status

2. **Coordinate Response**
   - Assign roles and responsibilities
   - Set up war room
   - Communicate with users

#### Resolution (15+ minutes)
1. **Implement Fix**
   - Apply corrective actions
   - Verify resolution
   - Monitor stability

2. **Post-Incident**
   - Document lessons learned
   - Update procedures
   - Conduct post-mortem

### Data Loss Incident

#### Immediate Response
1. **Assess Data Loss**
   - Identify affected data
   - Check backup availability
   - Estimate data loss scope

2. **Preserve Evidence**
   - Document current state
   - Collect logs and metrics
   - Notify security team

3. **Begin Recovery**
   - Restore from backup
   - Verify data integrity
   - Update affected users

#### Escalation
1. **Notify Management**
   - Contact technical director
   - Notify compliance team
   - Update executive team

2. **Regulatory Notification**
   - Check notification requirements
   - Prepare regulatory reports
   - Contact legal team

### Security Breach

#### Immediate Response
1. **Contain Breach**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Assess Impact**
   - Identify compromised data
   - Check for data exfiltration
   - Estimate breach scope

3. **Begin Investigation**
   - Collect forensic evidence
   - Document timeline
   - Coordinate with security team

#### Escalation
1. **Notify Authorities**
   - Contact law enforcement
   - Notify regulatory bodies
   - Update legal team

2. **Public Communication**
   - Prepare public statements
   - Notify affected users
   - Coordinate with PR team

---

## Document Control

**Version**: 1.0  
**Last Updated**: January 15, 2025  
**Next Review**: April 15, 2025  
**Approved By**: Technical Director  
**Distribution**: Engineering Team, Operations Team, Support Team

**Change Log**:
- v1.0: Initial creation with comprehensive troubleshooting procedures

---

*This troubleshooting guide is a living document and should be updated regularly to reflect changes in system architecture, new issues, and improved procedures.*