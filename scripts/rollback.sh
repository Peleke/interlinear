#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

ENV=${1:-}
validate_env "$ENV"

PROJECT_ID=$(get_project_id "$ENV")
REGION=$(get_region "$ENV")
SERVICE="interlinear-$ENV"

info "Rollback for $ENV environment"

# List recent revisions
info "Recent revisions for $SERVICE:"
gcloud run revisions list \
  --service="$SERVICE" \
  --region="$REGION" \
  --limit=5 \
  --format="table(metadata.name,status.conditions[0].status,metadata.creationTimestamp)"

# Get revision to rollback to
read -p "Enter revision name to rollback to: " REVISION

if [[ -z "$REVISION" ]]; then
  error "No revision specified"
  exit 1
fi

# Confirm rollback
if ! confirm "Rollback $SERVICE to $REVISION?"; then
  warn "Rollback cancelled"
  exit 0
fi

# Perform rollback
info "Rolling back to $REVISION..."
gcloud run services update-traffic "$SERVICE" \
  --to-revisions="$REVISION=100" \
  --region="$REGION"

info "✓ Rollback complete"
