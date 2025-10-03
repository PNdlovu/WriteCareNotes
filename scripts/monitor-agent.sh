#!/bin/bash

# Pilot Feedback Agent Monitoring Script
# This script provides comprehensive monitoring and health checking for the agent system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ACTION="${1:-status}"
TENANT_ID="${2:-}"
DETAILED="${3:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl cluster context is not set or cluster is not accessible"
        exit 1
    fi
}

# Get agent status
get_agent_status() {
    log_info "Getting agent status..."
    
    # Check if namespace exists
    if ! kubectl get namespace pilot-feedback-agent &> /dev/null; then
        log_error "Namespace pilot-feedback-agent does not exist"
        return 1
    fi
    
    # Get pod status
    echo ""
    log_info "Pod Status:"
    kubectl get pods -n pilot-feedback-agent -o wide
    
    # Get service status
    echo ""
    log_info "Service Status:"
    kubectl get services -n pilot-feedback-agent
    
    # Get deployment status
    echo ""
    log_info "Deployment Status:"
    kubectl get deployments -n pilot-feedback-agent
    
    # Get ingress status
    echo ""
    log_info "Ingress Status:"
    kubectl get ingress -n pilot-feedback-agent 2>/dev/null || echo "No ingress found"
}

# Get detailed health information
get_health_info() {
    log_info "Getting detailed health information..."
    
    # Check agent service health
    echo ""
    log_info "Agent Service Health:"
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        curl -s http://localhost:3000/health | jq '.' 2>/dev/null || {
        log_error "Failed to get agent service health"
    }
    
    # Check PII masking service health
    echo ""
    log_info "PII Masking Service Health:"
    kubectl exec -n pilot-feedback-agent deployment/pii-masking-service -- \
        curl -s http://localhost:3001/health | jq '.' 2>/dev/null || {
        log_error "Failed to get PII masking service health"
    }
    
    # Check database connectivity
    echo ""
    log_info "Database Connectivity:"
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        node scripts/check-database.js 2>/dev/null || {
        log_error "Database connectivity check failed"
    }
}

# Get metrics information
get_metrics() {
    local tenant_id="$1"
    
    log_info "Getting metrics information..."
    
    if [ -n "$tenant_id" ]; then
        log_info "Metrics for tenant: $tenant_id"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-metrics.js --tenant-id="$tenant_id" --detailed="$DETAILED" | jq '.' 2>/dev/null || {
            log_error "Failed to get metrics for tenant $tenant_id"
        }
    else
        log_info "System-wide metrics:"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-metrics.js --detailed="$DETAILED" | jq '.' 2>/dev/null || {
            log_error "Failed to get system metrics"
        }
    fi
}

# Get logs
get_logs() {
    local service="${1:-pilot-feedback-agent}"
    local lines="${2:-100}"
    
    log_info "Getting logs for service: $service (last $lines lines)"
    
    kubectl logs -n pilot-feedback-agent deployment/"$service" --tail="$lines" --timestamps
}

# Get alerts
get_alerts() {
    local tenant_id="$1"
    
    log_info "Getting alerts..."
    
    if [ -n "$tenant_id" ]; then
        log_info "Alerts for tenant: $tenant_id"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-alerts.js --tenant-id="$tenant_id" | jq '.' 2>/dev/null || {
            log_error "Failed to get alerts for tenant $tenant_id"
        }
    else
        log_info "System-wide alerts:"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-alerts.js | jq '.' 2>/dev/null || {
            log_error "Failed to get system alerts"
        }
    fi
}

# Get compliance status
get_compliance_status() {
    local tenant_id="$1"
    
    log_info "Getting compliance status..."
    
    if [ -n "$tenant_id" ]; then
        log_info "Compliance status for tenant: $tenant_id"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-compliance-status.js --tenant-id="$tenant_id" | jq '.' 2>/dev/null || {
            log_error "Failed to get compliance status for tenant $tenant_id"
        }
    else
        log_info "System-wide compliance status:"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-compliance-status.js | jq '.' 2>/dev/null || {
            log_error "Failed to get system compliance status"
        }
    fi
}

# Get audit logs
get_audit_logs() {
    local tenant_id="$1"
    local hours="${2:-24}"
    
    log_info "Getting audit logs (last $hours hours)..."
    
    if [ -n "$tenant_id" ]; then
        log_info "Audit logs for tenant: $tenant_id"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-audit-logs.js --tenant-id="$tenant_id" --hours="$hours" | jq '.' 2>/dev/null || {
            log_error "Failed to get audit logs for tenant $tenant_id"
        }
    else
        log_info "System-wide audit logs:"
        kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
            node scripts/get-audit-logs.js --hours="$hours" | jq '.' 2>/dev/null || {
            log_error "Failed to get system audit logs"
        }
    fi
}

# Restart services
restart_services() {
    local service="${1:-all}"
    
    log_info "Restarting services: $service"
    
    case "$service" in
        all)
            kubectl rollout restart deployment/pilot-feedback-agent -n pilot-feedback-agent
            kubectl rollout restart deployment/pii-masking-service -n pilot-feedback-agent
            ;;
        agent)
            kubectl rollout restart deployment/pilot-feedback-agent -n pilot-feedback-agent
            ;;
        masking)
            kubectl rollout restart deployment/pii-masking-service -n pilot-feedback-agent
            ;;
        *)
            log_error "Invalid service: $service. Must be one of: all, agent, masking"
            exit 1
            ;;
    esac
    
    log_success "Services restarted successfully"
}

# Scale services
scale_services() {
    local service="${1:-pilot-feedback-agent}"
    local replicas="${2:-1}"
    
    log_info "Scaling $service to $replicas replicas"
    
    kubectl scale deployment/"$service" -n pilot-feedback-agent --replicas="$replicas"
    
    log_success "Service scaled successfully"
}

# Run diagnostics
run_diagnostics() {
    local tenant_id="$1"
    
    log_info "Running comprehensive diagnostics..."
    
    # System health
    echo ""
    log_info "=== System Health ==="
    get_agent_status
    
    # Detailed health
    if [ "$DETAILED" = "true" ]; then
        echo ""
        log_info "=== Detailed Health ==="
        get_health_info
    fi
    
    # Metrics
    echo ""
    log_info "=== Metrics ==="
    get_metrics "$tenant_id"
    
    # Alerts
    echo ""
    log_info "=== Alerts ==="
    get_alerts "$tenant_id"
    
    # Compliance
    echo ""
    log_info "=== Compliance Status ==="
    get_compliance_status "$tenant_id"
    
    # Recent logs
    echo ""
    log_info "=== Recent Logs ==="
    get_logs "pilot-feedback-agent" 50
    
    log_success "Diagnostics completed"
}

# Generate report
generate_report() {
    local tenant_id="$1"
    local output_file="${2:-agent-report-$(date +%Y%m%d-%H%M%S).json}"
    
    log_info "Generating comprehensive report..."
    
    # Create report data
    local report_data
    report_data=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tenant_id": "$tenant_id",
  "system_status": $(kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- curl -s http://localhost:3000/health 2>/dev/null || echo 'null'),
  "metrics": $(kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- node scripts/get-metrics.js --tenant-id="$tenant_id" 2>/dev/null || echo 'null'),
  "alerts": $(kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- node scripts/get-alerts.js --tenant-id="$tenant_id" 2>/dev/null || echo 'null'),
  "compliance": $(kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- node scripts/get-compliance-status.js --tenant-id="$tenant_id" 2>/dev/null || echo 'null')
}
EOF
)
    
    # Save report
    echo "$report_data" | jq '.' > "$output_file"
    
    log_success "Report generated: $output_file"
}

# Show usage information
show_usage() {
    echo "Usage: $0 <action> [tenant_id] [detailed]"
    echo ""
    echo "Actions:"
    echo "  status        Get basic system status"
    echo "  health        Get detailed health information"
    echo "  metrics       Get metrics information"
    echo "  logs          Get service logs"
    echo "  alerts        Get alerts information"
    echo "  compliance    Get compliance status"
    echo "  audit         Get audit logs"
    echo "  restart       Restart services"
    echo "  scale         Scale services"
    echo "  diagnostics   Run comprehensive diagnostics"
    echo "  report        Generate comprehensive report"
    echo ""
    echo "Arguments:"
    echo "  tenant_id     Optional tenant ID for tenant-specific information"
    echo "  detailed      Set to 'true' for detailed information (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 health t-123 true"
    echo "  $0 metrics t-456"
    echo "  $0 logs pilot-feedback-agent 200"
    echo "  $0 restart all"
    echo "  $0 scale pilot-feedback-agent 3"
    echo "  $0 diagnostics t-789"
    echo "  $0 report t-123 agent-report.json"
}

# Main function
main() {
    # Check prerequisites
    check_kubectl
    
    # Execute action
    case "$ACTION" in
        status)
            get_agent_status
            ;;
        health)
            get_agent_status
            get_health_info
            ;;
        metrics)
            get_metrics "$TENANT_ID"
            ;;
        logs)
            get_logs "${TENANT_ID:-pilot-feedback-agent}" "${DETAILED:-100}"
            ;;
        alerts)
            get_alerts "$TENANT_ID"
            ;;
        compliance)
            get_compliance_status "$TENANT_ID"
            ;;
        audit)
            get_audit_logs "$TENANT_ID" "${DETAILED:-24}"
            ;;
        restart)
            restart_services "${TENANT_ID:-all}"
            ;;
        scale)
            scale_services "${TENANT_ID:-pilot-feedback-agent}" "${DETAILED:-1}"
            ;;
        diagnostics)
            run_diagnostics "$TENANT_ID"
            ;;
        report)
            generate_report "$TENANT_ID" "${DETAILED:-}"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
}

# Check if help is requested
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_usage
    exit 0
fi

# Validate arguments
if [ $# -lt 1 ]; then
    log_error "Missing required argument: action"
    show_usage
    exit 1
fi

# Run main function
main "$@"