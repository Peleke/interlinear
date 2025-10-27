#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

ENV=${1:-}
validate_env "$ENV"

# Check for --with-cloud-run flag and optional image tag
DEPLOY_CLOUD_RUN=false
IMAGE_TAG="latest"
shift  # Remove first argument (ENV)

while [[ $# -gt 0 ]]; do
  case $1 in
    --with-cloud-run)
      DEPLOY_CLOUD_RUN=true
      shift
      ;;
    --image-tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      warn "Unknown option: $1"
      exit 1
      ;;
  esac
done

PROJECT_ID=$(get_project_id "$ENV")
REGION=$(get_region "$ENV")

if [ "$DEPLOY_CLOUD_RUN" = true ]; then
  info "Deploying infrastructure + Cloud Run to $ENV environment"
  info "Image tag: $IMAGE_TAG"
else
  info "Deploying base infrastructure to $ENV environment (registry, IAM, secrets)"
fi
info "Project: $PROJECT_ID | Region: $REGION"

# Confirm deployment
CONFIRM_MSG="Deploy Tofu infrastructure to $ENV?"
if [ "$DEPLOY_CLOUD_RUN" = true ]; then
  CONFIRM_MSG="Deploy Cloud Run service to $ENV? (requires container image)"
fi

if ! confirm "$CONFIRM_MSG"; then
  warn "Deployment cancelled"
  exit 0
fi

# Navigate to terraform directory
cd terraform

# Initialize Tofu
info "Initializing Tofu..."
tofu init

# Format check
info "Checking Terraform formatting..."
tofu fmt -check || {
  warn "Files need formatting. Run: tofu fmt -recursive"
}

# Validate
info "Validating configuration..."
tofu validate

# Plan
info "Planning infrastructure changes..."
tofu plan \
  -var-file=environments/$ENV.tfvars \
  -var="deploy_cloud_run=$DEPLOY_CLOUD_RUN" \
  -var="image_tag=$IMAGE_TAG" \
  -out=/tmp/tfplan-$ENV

# Review and apply
if confirm "Apply these changes?"; then
  info "Applying infrastructure..."
  tofu apply /tmp/tfplan-$ENV

  if [ "$DEPLOY_CLOUD_RUN" = true ]; then
    info "✓ Infrastructure + Cloud Run deployed to $ENV"
  else
    info "✓ Base infrastructure deployed to $ENV"
    info ""
    info "Next steps:"
    info "  1. Build and push container: ./scripts/deploy-app.sh $ENV"
    info "  2. Deploy Cloud Run: ./scripts/deploy-infra.sh $ENV --with-cloud-run --image-tag <tag>"
  fi
else
  warn "Apply cancelled"
  exit 0
fi

# Clean up plan file
rm -f /tmp/tfplan-$ENV
