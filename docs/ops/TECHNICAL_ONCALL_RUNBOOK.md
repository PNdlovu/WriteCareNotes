# Technical On-Call Runbook – WriteCareNotes

## Purpose
To provide clear guidance for engineers handling technical incidents and system outages during on-call rotations for the WriteCareNotes care home management system.

## On-Call Rotation
- **24/7 coverage** for production systems
- **Weekly rotation** among engineering team
- **Backup engineer** assigned for escalation
- **Primary contact**: PagerDuty/Slack alerts
- **Escalation window**: 15 minutes for critical issues

## Escalation Path
1. **Primary On-Call Engineer** (0-15 min)
2. **Secondary Engineer (Backup)** (15-30 min)
3. **Engineering Manager** (30-60 min)
4. **Technical Director** (60+ min)
5. **CTO** (for critical system-wide outages)

## Severity Response Times
- **P1 - Critical**: Immediate response (<15 min)
  - Complete system outage
  - Data loss or corruption
  - Security breach
  - Patient safety impact
- **P2 - High**: 1 hour response
  - Major feature unavailable
  - Performance degradation >50%
  - Database connectivity issues
- **P3 - Medium**: 8 hours response
  - Minor feature issues
  - Performance degradation <50%
  - Non-critical service down
- **P4 - Low**: 24 hours response
  - Cosmetic issues
  - Enhancement requests
  - Documentation updates

## Communication Channels
- **PagerDuty**: Critical alerts and escalation
- **Slack**: #incidents channel for real-time updates
- **Email**: Incident notifications to stakeholders
- **Status Page**: Public updates for service status
- **War Room**: Zoom/Teams for complex incidents

## System Architecture Overview

### Core Services
- **API Gateway**: Express.js with rate limiting
- **Authentication Service**: JWT-based auth with bcrypt
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis for session management
- **File Storage**: AWS S3 for documents
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston with structured logging

### Microservices
- **Care Planning Service**: Resident care management
- **Medication Service**: Medication tracking and alerts
- **NHS Integration Service**: External API connections
- **Notification Service**: Email/SMS alerts
- **Reporting Service**: Analytics and compliance reports
- **AI Agent Service**: Intelligent care assistance

## Standard Playbooks

### 1. Database Issues

#### Symptoms
- High database connection errors
- Slow query performance
- Connection pool exhaustion
- Database locks or deadlocks

#### Response Steps
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check database status
   kubectl get pods -n writecarenotes | grep postgres
   
   # Check connection pool
   kubectl logs -n writecarenotes deployment/api-gateway | grep -i "connection"
   
   # Check database metrics
   kubectl port-forward -n monitoring svc/prometheus 9090:9090
   # Open http://localhost:9090 and query: rate(postgres_connections_active[5m])
   ```

2. **Quick Fixes** (5-15 min)
   ```bash
   # Restart database if needed
   kubectl rollout restart deployment/postgres -n writecarenotes
   
   # Scale up database connections
   kubectl patch deployment api-gateway -n writecarenotes -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"DB_POOL_SIZE","value":"20"}]}]}}}}'
   
   # Clear connection pool
   kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHDB
   ```

3. **Investigation** (15+ min)
   - Check slow query log
   - Analyze connection patterns
   - Review recent deployments
   - Check for data corruption

#### Escalation Criteria
- Database completely unreachable
- Data corruption detected
- Recovery time >30 minutes

### 2. API Gateway Issues

#### Symptoms
- 5xx errors from API
- High response times
- Rate limiting issues
- Authentication failures

#### Response Steps
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check API gateway status
   kubectl get pods -n writecarenotes | grep api-gateway
   
   # Check error logs
   kubectl logs -n writecarenotes deployment/api-gateway --tail=100 | grep -E "(ERROR|FATAL)"
   
   # Check metrics
   curl -s http://api-gateway.writecarenotes.svc.cluster.local/health
   ```

2. **Quick Fixes** (5-15 min)
   ```bash
   # Restart API gateway
   kubectl rollout restart deployment/api-gateway -n writecarenotes
   
   # Check resource limits
   kubectl describe pod -n writecarenotes -l app=api-gateway
   
   # Scale horizontally if needed
   kubectl scale deployment api-gateway -n writecarenotes --replicas=3
   ```

3. **Investigation** (15+ min)
   - Review recent deployments
   - Check for memory leaks
   - Analyze request patterns
   - Verify upstream services

### 3. Authentication Service Issues

#### Symptoms
- Login failures
- JWT token errors
- Session management issues
- User lockouts

#### Response Steps
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check auth service status
   kubectl get pods -n writecarenotes | grep auth
   
   # Check auth logs
   kubectl logs -n writecarenotes deployment/auth-service --tail=100 | grep -E "(ERROR|FATAL)"
   
   # Test authentication
   curl -X POST http://auth.writecarenotes.svc.cluster.local/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

2. **Quick Fixes** (5-15 min)
   ```bash
   # Restart auth service
   kubectl rollout restart deployment/auth-service -n writecarenotes
   
   # Clear Redis sessions
   kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHDB
   
   # Check JWT secret
   kubectl get secret jwt-secret -n writecarenotes -o yaml
   ```

3. **Investigation** (15+ min)
   - Check user database
   - Verify JWT configuration
   - Review security logs
   - Check for brute force attacks

### 4. File Storage Issues

#### Symptoms
- File upload failures
- Document access errors
- S3 connectivity issues
- Storage quota exceeded

#### Response Steps
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check S3 connectivity
   aws s3 ls s3://writecarenotes-documents/ --profile writecarenotes
   
   # Check file service logs
   kubectl logs -n writecarenotes deployment/file-service --tail=100
   
   # Test file upload
   curl -X POST http://file.writecarenotes.svc.cluster.local/upload \
     -F "file=@test.txt"
   ```

2. **Quick Fixes** (5-15 min)
   ```bash
   # Restart file service
   kubectl rollout restart deployment/file-service -n writecarenotes
   
   # Check AWS credentials
   kubectl get secret aws-credentials -n writecarenotes -o yaml
   
   # Clear file cache
   kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHDB
   ```

3. **Investigation** (15+ min)
   - Check S3 bucket permissions
   - Verify AWS region settings
   - Review storage usage
   - Check for corrupted files

### 5. Microservice Communication Issues

#### Symptoms
- Service-to-service timeouts
- Circuit breaker trips
- Network connectivity issues
- Load balancer problems

#### Response Steps
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check all service status
   kubectl get pods -n writecarenotes
   
   # Check service mesh (if using Istio)
   kubectl get virtualservices -n writecarenotes
   
   # Check network policies
   kubectl get networkpolicies -n writecarenotes
   ```

2. **Quick Fixes** (5-15 min)
   ```bash
   # Restart affected services
   kubectl rollout restart deployment/[service-name] -n writecarenotes
   
   # Check service endpoints
   kubectl get endpoints -n writecarenotes
   
   # Verify DNS resolution
   kubectl run debug --image=busybox -it --rm -- nslookup [service-name]
   ```

3. **Investigation** (15+ min)
   - Check service mesh configuration
   - Review network policies
   - Analyze traffic patterns
   - Check for resource constraints

## Monitoring and Alerting

### Key Metrics to Monitor
- **Response Time**: P95 < 500ms, P99 < 1000ms
- **Error Rate**: < 1% for 5xx errors
- **Throughput**: Requests per second
- **Database Connections**: < 80% of pool size
- **Memory Usage**: < 80% of allocated
- **CPU Usage**: < 70% of allocated
- **Disk Usage**: < 85% of allocated

### Alert Thresholds
- **Critical**: Response time > 2s, Error rate > 5%
- **Warning**: Response time > 1s, Error rate > 2%
- **Info**: Response time > 500ms, Error rate > 1%

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation and analysis
- **PagerDuty**: Alert routing and escalation

## Incident Response Workflow

### 1. Incident Detection
- Automated alerts from monitoring systems
- User reports via support channels
- Manual detection during routine checks

### 2. Initial Response (0-15 min)
1. **Acknowledge** the incident in PagerDuty
2. **Assess** severity and impact
3. **Create** incident channel in Slack
4. **Notify** stakeholders if P1/P2
5. **Begin** initial troubleshooting

### 3. Investigation (15-60 min)
1. **Gather** information from monitoring tools
2. **Check** recent deployments and changes
3. **Review** logs and metrics
4. **Identify** root cause
5. **Implement** fix or workaround

### 4. Resolution (60+ min)
1. **Deploy** fix to production
2. **Verify** resolution
3. **Monitor** for stability
4. **Update** stakeholders
5. **Close** incident in PagerDuty

### 5. Post-Incident (24-48 hours)
1. **Conduct** post-mortem meeting
2. **Document** lessons learned
3. **Create** action items
4. **Update** runbooks and procedures
5. **Share** findings with team

## Common Troubleshooting Commands

### Kubernetes Commands
```bash
# Check pod status
kubectl get pods -n writecarenotes

# View pod logs
kubectl logs -n writecarenotes deployment/[service-name] --tail=100

# Describe pod for events
kubectl describe pod -n writecarenotes [pod-name]

# Check service endpoints
kubectl get endpoints -n writecarenotes

# Port forward for debugging
kubectl port-forward -n writecarenotes svc/[service-name] 8080:80

# Execute commands in pod
kubectl exec -n writecarenotes -it [pod-name] -- /bin/bash

# Check resource usage
kubectl top pods -n writecarenotes
kubectl top nodes
```

### Database Commands
```bash
# Connect to database
kubectl exec -n writecarenotes -it deployment/postgres -- psql -U writecarenotes -d writecarenotes

# Check database size
kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT pg_size_pretty(pg_database_size('writecarenotes'));"

# Check active connections
kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
kubectl exec -n writecarenotes deployment/postgres -- psql -U writecarenotes -d writecarenotes -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Redis Commands
```bash
# Connect to Redis
kubectl exec -n writecarenotes -it deployment/redis -- redis-cli

# Check Redis info
kubectl exec -n writecarenotes deployment/redis -- redis-cli INFO

# Check memory usage
kubectl exec -n writecarenotes deployment/redis -- redis-cli INFO memory

# Clear all data
kubectl exec -n writecarenotes deployment/redis -- redis-cli FLUSHALL
```

## Emergency Contacts

### Internal Team
- **Primary On-Call**: [PHONE] / [EMAIL]
- **Secondary On-Call**: [PHONE] / [EMAIL]
- **Engineering Manager**: [PHONE] / [EMAIL]
- **Technical Director**: [PHONE] / [EMAIL]
- **CTO**: [PHONE] / [EMAIL]

### External Services
- **AWS Support**: Enterprise support case
- **Kubernetes Support**: [SUPPORT_CHANNEL]
- **Database Support**: [SUPPORT_CHANNEL]
- **Monitoring Support**: [SUPPORT_CHANNEL]

### Escalation Contacts
- **Infrastructure Team**: [PHONE] / [EMAIL]
- **Security Team**: [PHONE] / [EMAIL]
- **Compliance Team**: [PHONE] / [EMAIL]
- **Executive Team**: [PHONE] / [EMAIL]

## Documentation and Resources

### Runbooks and Procedures
- **Emergency Runbook**: `/docs/ops/ONCALL_RUNBOOK.md`
- **Deployment Guide**: `/docs/deployment/DEPLOYMENT_GUIDE.md`
- **Security Guide**: `/docs/security/SECURITY_IMPLEMENTATION_GUIDE.md`
- **API Documentation**: `/docs/api/`

### Monitoring Dashboards
- **System Overview**: [GRAFANA_URL]/d/system-overview
- **Application Metrics**: [GRAFANA_URL]/d/application-metrics
- **Database Metrics**: [GRAFANA_URL]/d/database-metrics
- **Infrastructure**: [GRAFANA_URL]/d/infrastructure

### Knowledge Base
- **Common Issues**: [CONFLUENCE_URL]/common-issues
- **Troubleshooting Guide**: [CONFLUENCE_URL]/troubleshooting
- **Architecture Docs**: [CONFLUENCE_URL]/architecture
- **Runbook Index**: [CONFLUENCE_URL]/runbooks

---

## Document Control

**Version**: 1.0  
**Last Updated**: [CURRENT_DATE]  
**Next Review**: [REVIEW_DATE]  
**Approved By**: [APPROVER_NAME]  
**Distribution**: All on-call engineers, engineering management

**Change Log**:
- v1.0: Initial creation with comprehensive technical incident response procedures

---

*This runbook is a living document and should be updated regularly to reflect changes in system architecture, procedures, and best practices. All on-call engineers are responsible for familiarizing themselves with its contents and ensuring compliance with all procedures.*