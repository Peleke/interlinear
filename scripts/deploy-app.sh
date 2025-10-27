#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

ENV=${1:-}
validate_env "$ENV"

PROJECT_ID=$(get_project_id "$ENV")
REGION=$(get_region "$ENV")
SERVICE="interlinear-$ENV"
REGISTRY="$REGION-docker.pkg.dev"
IMAGE_TAG=${2:-$(git rev-parse --short HEAD)}

info "Deploying app to $ENV environment"
info "Project: $PROJECT_ID | Region: $REGION"
info "Image tag: $IMAGE_TAG"

# Confirm deployment
if ! confirm "Build and deploy app to $ENV?"; then
  warn "Deployment cancelled"
  exit 0
fi

# Authenticate to GCP
info "Authenticating to GCP..."
gcloud config set project "$PROJECT_ID"

# Configure Docker for Artifact Registry
info "Configuring Docker authentication..."
gcloud auth configure-docker "$REGISTRY"

# Get Supabase URL from tfvars
SUPABASE_URL=$(grep 'supabase_url' terraform/environments/$ENV.tfvars | cut -d'"' -f2)

# Get Supabase anon key from Secret Manager
info "Fetching Supabase anon key from Secret Manager..."
SUPABASE_ANON_KEY=$(gcloud secrets versions access latest --secret="supabase-anon-key-$ENV")

# Build Docker image with NEXT_PUBLIC_* build args
info "Building Docker image with environment variables..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -t "$REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG" \
  -t "$REGISTRY/$PROJECT_ID/interlinear/app:latest" \
  .

# Push Docker image
info "Pushing image to Artifact Registry..."
docker push "$REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG"
docker push "$REGISTRY/$PROJECT_ID/interlinear/app:latest"

info "✓ Container built and pushed successfully"
info "Image: $REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG"
info ""
info "Next: Deploy Cloud Run service with Terraform:"
info "  ./scripts/deploy-infra.sh $ENV --with-cloud-run --image-tag $IMAGE_TAG"
