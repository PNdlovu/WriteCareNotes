#!/bin/bash

# Pilot Feedback Agent Rollout Script
# This script manages the phased rollout of the pilot feedback agent system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PHASE="${1:-shadow}"
TENANT_IDS="${2:-}"
DRY_RUN="${3:-false}"

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

# Validate rollout phase
validate_phase() {
    log_info "Validating rollout phase: $PHASE"
    
    case "$PHASE" in
        shadow|limited|pilot|ga)
            log_success "Phase $PHASE is valid"
            ;;
        *)
            log_error "Invalid phase: $PHASE. Must be one of: shadow, limited, pilot, ga"
            exit 1
            ;;
    esac
}

# Get tenant list for phase
get_tenant_list() {
    log_info "Getting tenant list for phase: $PHASE"
    
    if [ -n "$TENANT_IDS" ]; then
        echo "$TENANT_IDS" | tr ',' ' '
        return 0
    fi
    
    # Get tenants from database based on phase
    case "$PHASE" in
        shadow)
            # Get 1-2 pilot tenants for shadow mode
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/get-tenants.js --phase=shadow --limit=2
            ;;
        limited)
            # Get 5-10 tenants for limited rollout
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/get-tenants.js --phase=limited --limit=10
            ;;
        pilot)
            # Get all pilot tenants
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/get-tenants.js --phase=pilot
            ;;
        ga)
            # Get all tenants
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/get-tenants.js --phase=ga
            ;;
    esac
}

# Configure phase-specific settings
configure_phase_settings() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Configuring phase settings for tenant $tenant_id in phase $phase"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would configure phase settings for tenant $tenant_id"
        return 0
    fi
    
    case "$phase" in
        shadow)
            # Shadow mode: Agent disabled, no external outputs
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/configure-tenant.js \
                --tenant-id="$tenant_id" \
                --enable-agent=false \
                --autonomy="recommend-only" \
                --enable-outputs=false \
                --enable-notifications=false
            ;;
        limited)
            # Limited mode: Agent enabled, recommendations only
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/configure-tenant.js \
                --tenant-id="$tenant_id" \
                --enable-agent=true \
                --autonomy="recommend-only" \
                --enable-outputs=true \
                --enable-notifications=true \
                --enable-auto-ticketing=false
            ;;
        pilot)
            # Pilot mode: Full features, human approval required
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/configure-tenant.js \
                --tenant-id="$tenant_id" \
                --enable-agent=true \
                --autonomy="recommend-only" \
                --enable-outputs=true \
                --enable-notifications=true \
                --enable-auto-ticketing=false \
                --enable-monitoring=true
            ;;
        ga)
            # GA mode: Full features, production ready
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/configure-tenant.js \
                --tenant-id="$tenant_id" \
                --enable-agent=true \
                --autonomy="recommend-only" \
                --enable-outputs=true \
                --enable-notifications=true \
                --enable-auto-ticketing=false \
                --enable-monitoring=true \
                --enable-alerts=true
            ;;
    esac
    
    log_success "Phase settings configured for tenant $tenant_id"
}

# Set feature flags for phase
set_feature_flags() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Setting feature flags for tenant $tenant_id in phase $phase"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would set feature flags for tenant $tenant_id"
        return 0
    fi
    
    case "$phase" in
        shadow)
            # Shadow mode: Minimal features
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --tenant-id="$tenant_id" \
                --enabled-flags="clustering,summarization" \
                --disabled-flags="recommendations,notifications,monitoring"
            ;;
        limited)
            # Limited mode: Core features
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --tenant-id="$tenant_id" \
                --enabled-flags="clustering,summarization,recommendations,notifications" \
                --disabled-flags="monitoring,alerts"
            ;;
        pilot)
            # Pilot mode: Most features
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --tenant-id="$tenant_id" \
                --enabled-flags="clustering,summarization,recommendations,notifications,monitoring" \
                --disabled-flags="alerts"
            ;;
        ga)
            # GA mode: All features
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --tenant-id="$tenant_id" \
                --enabled-flags="clustering,summarization,recommendations,notifications,monitoring,alerts"
            ;;
    esac
    
    log_success "Feature flags set for tenant $tenant_id"
}

# Run phase-specific validation
run_phase_validation() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Running phase validation for tenant $tenant_id in phase $phase"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would run phase validation for tenant $tenant_id"
        return 0
    fi
    
    case "$phase" in
        shadow)
            # Shadow mode validation: No external outputs
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/validate-phase.js \
                --phase=shadow \
                --tenant-id="$tenant_id" \
                --check-outputs=false \
                --check-notifications=false
            ;;
        limited)
            # Limited mode validation: Basic functionality
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/validate-phase.js \
                --phase=limited \
                --tenant-id="$tenant_id" \
                --check-outputs=true \
                --check-notifications=true \
                --check-auto-ticketing=false
            ;;
        pilot)
            # Pilot mode validation: Full functionality
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/validate-phase.js \
                --phase=pilot \
                --tenant-id="$tenant_id" \
                --check-outputs=true \
                --check-notifications=true \
                --check-auto-ticketing=false \
                --check-monitoring=true
            ;;
        ga)
            # GA mode validation: Production ready
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/validate-phase.js \
                --phase=ga \
                --tenant-id="$tenant_id" \
                --check-outputs=true \
                --check-notifications=true \
                --check-auto-ticketing=false \
                --check-monitoring=true \
                --check-alerts=true
            ;;
    esac
    
    log_success "Phase validation passed for tenant $tenant_id"
}

# Monitor phase metrics
monitor_phase_metrics() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Monitoring phase metrics for tenant $tenant_id in phase $phase"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would monitor phase metrics for tenant $tenant_id"
        return 0
    fi
    
    # Get metrics for the tenant
    local metrics
    metrics=$(kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        node scripts/get-metrics.js --tenant-id="$tenant_id" --phase="$phase")
    
    # Check phase-specific success criteria
    case "$phase" in
        shadow)
            # Shadow mode: No errors, basic processing
            local error_rate
            error_rate=$(echo "$metrics" | jq -r '.errorRate')
            if (( $(echo "$error_rate > 0.05" | bc -l) )); then
                log_error "Shadow mode error rate too high: $error_rate"
                return 1
            fi
            ;;
        limited)
            # Limited mode: Good processing, some recommendations
            local processing_rate
            processing_rate=$(echo "$metrics" | jq -r '.processingRate')
            if (( $(echo "$processing_rate < 0.8" | bc -l) )); then
                log_error "Limited mode processing rate too low: $processing_rate"
                return 1
            fi
            ;;
        pilot)
            # Pilot mode: Good performance, user engagement
            local approval_rate
            approval_rate=$(echo "$metrics" | jq -r '.approvalRate')
            if (( $(echo "$approval_rate < 0.7" | bc -l) )); then
                log_warning "Pilot mode approval rate low: $approval_rate"
            fi
            ;;
        ga)
            # GA mode: Production performance
            local uptime
            uptime=$(echo "$metrics" | jq -r '.uptime')
            if (( $(echo "$uptime < 0.99" | bc -l) )); then
                log_error "GA mode uptime too low: $uptime"
                return 1
            fi
            ;;
    esac
    
    log_success "Phase metrics validation passed for tenant $tenant_id"
}

# Send phase notification
send_phase_notification() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Sending phase notification for tenant $tenant_id in phase $phase"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would send phase notification for tenant $tenant_id"
        return 0
    fi
    
    # Send notification to stakeholders
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        node scripts/send-notification.js \
        --phase="$phase" \
        --tenant-id="$tenant_id" \
        --type="phase_rollout" \
        --recipients="pilot-admin,compliance-officer,development-team"
    
    log_success "Phase notification sent for tenant $tenant_id"
}

# Rollout to single tenant
rollout_to_tenant() {
    local phase="$1"
    local tenant_id="$2"
    
    log_info "Rolling out to tenant $tenant_id in phase $phase"
    
    # Configure phase settings
    configure_phase_settings "$phase" "$tenant_id"
    
    # Set feature flags
    set_feature_flags "$phase" "$tenant_id"
    
    # Run validation
    run_phase_validation "$phase" "$tenant_id"
    
    # Monitor metrics
    monitor_phase_metrics "$phase" "$tenant_id"
    
    # Send notification
    send_phase_notification "$phase" "$tenant_id"
    
    log_success "Rollout completed for tenant $tenant_id"
}

# Main rollout function
main() {
    log_info "Starting pilot feedback agent rollout"
    log_info "Phase: $PHASE"
    log_info "Tenant IDs: ${TENANT_IDS:-'Auto-selected'}"
    log_info "Dry run: $DRY_RUN"
    
    # Validate phase
    validate_phase
    
    # Get tenant list
    local tenants
    tenants=($(get_tenant_list))
    
    if [ ${#tenants[@]} -eq 0 ]; then
        log_error "No tenants found for phase $PHASE"
        exit 1
    fi
    
    log_info "Found ${#tenants[@]} tenants for rollout: ${tenants[*]}"
    
    # Rollout to each tenant
    local success_count=0
    local failure_count=0
    
    for tenant_id in "${tenants[@]}"; do
        if rollout_to_tenant "$PHASE" "$tenant_id"; then
            ((success_count++))
        else
            ((failure_count++))
            log_error "Rollout failed for tenant $tenant_id"
        fi
    done
    
    # Summary
    log_info "Rollout Summary:"
    echo "  Phase: $PHASE"
    echo "  Total Tenants: ${#tenants[@]}"
    echo "  Successful: $success_count"
    echo "  Failed: $failure_count"
    
    if [ $failure_count -gt 0 ]; then
        log_warning "Some rollouts failed. Check logs for details."
        exit 1
    fi
    
    log_success "Rollout completed successfully!"
}

# Show usage information
show_usage() {
    echo "Usage: $0 <phase> [tenant_ids] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  phase         Rollout phase (shadow|limited|pilot|ga)"
    echo "  tenant_ids    Comma-separated list of tenant IDs (optional)"
    echo "  dry_run       Set to 'true' for dry run mode (optional)"
    echo ""
    echo "Phases:"
    echo "  shadow        Shadow mode - Agent disabled, no external outputs"
    echo "  limited       Limited mode - Core features, recommendations only"
    echo "  pilot         Pilot mode - Most features, human approval required"
    echo "  ga            GA mode - All features, production ready"
    echo ""
    echo "Examples:"
    echo "  $0 shadow"
    echo "  $0 limited t-123,t-456"
    echo "  $0 pilot t-789 true"
    echo "  $0 ga"
}

# Check if help is requested
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_usage
    exit 0
fi

# Validate arguments
if [ $# -lt 1 ]; then
    log_error "Missing required argument: phase"
    show_usage
    exit 1
fi

# Run main function
main "$@"