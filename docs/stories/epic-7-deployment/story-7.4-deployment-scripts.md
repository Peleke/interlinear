# Story 7.4: Deployment Scripts

## Summary
Simple deployment scripts for manual infrastructure and service deployment to staging/prod.

## Acceptance Criteria
- Deployment wrapper script for environment selection
- Infrastructure deployment commands
- Container build and push workflow
- Service deployment commands
- Rollback capability

## Directory Structure
```
scripts/
├── deploy-infra.sh    # Deploy Tofu infrastructure
├── deploy-app.sh      # Build, push, deploy app
├── rollback.sh        # Rollback to previous revision
└── lib/
    └── common.sh      # Shared functions
```

## scripts/lib/common.sh
```bash
#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_env() {
  local env=$1
  if [[ ! "$env" =~ ^(staging|prod)$ ]]; then
    error "Invalid environment: $env"
    echo "Usage: $0 <staging|prod>"
    exit 1
  fi
}

# Confirm action
confirm() {
  local message=$1
  read -p "$(echo -e ${YELLOW}$message${NC} [y/N]: )" -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}

# Get project ID from tfvars
get_project_id() {
  local env=$1
  grep 'project_id' terraform/environments/$env.tfvars | cut -d'"' -f2
}

# Get region from tfvars
get_region() {
  local env=$1
  grep 'region' terraform/environments/$env.tfvars | cut -d'"' -f2
}
```

## scripts/deploy-infra.sh
```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

ENV=${1:-}
validate_env "$ENV"

PROJECT_ID=$(get_project_id "$ENV")
REGION=$(get_region "$ENV")

info "Deploying infrastructure to $ENV environment"
info "Project: $PROJECT_ID | Region: $REGION"

# Confirm deployment
if ! confirm "Deploy Tofu infrastructure to $ENV?"; then
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
tofu plan -var-file=environments/$ENV.tfvars -out=/tmp/tfplan-$ENV

# Review and apply
if confirm "Apply these changes?"; then
  info "Applying infrastructure..."
  tofu apply /tmp/tfplan-$ENV
  info "✓ Infrastructure deployed to $ENV"
else
  warn "Apply cancelled"
  exit 0
fi

# Clean up plan file
rm -f /tmp/tfplan-$ENV
```

## scripts/deploy-app.sh
```bash
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

# Build Docker image
info "Building Docker image..."
docker build \
  -t "$REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG" \
  -t "$REGISTRY/$PROJECT_ID/interlinear/app:latest" \
  .

# Push Docker image
info "Pushing image to Artifact Registry..."
docker push "$REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG"
docker push "$REGISTRY/$PROJECT_ID/interlinear/app:latest"

# Deploy to Cloud Run
info "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image="$REGISTRY/$PROJECT_ID/interlinear/app:$IMAGE_TAG" \
  --region="$REGION" \
  --platform=managed

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='value(status.url)')

info "✓ App deployed successfully"
info "Service URL: $SERVICE_URL"
```

## scripts/rollback.sh
```bash
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
```

## Usage

### Deploy Infrastructure
```bash
# Deploy to staging
./scripts/deploy-infra.sh staging

# Deploy to production
./scripts/deploy-infra.sh prod
```

### Deploy Application
```bash
# Deploy to staging with auto-generated tag
./scripts/deploy-app.sh staging

# Deploy to prod with specific tag
./scripts/deploy-app.sh prod v1.2.3
```

### Rollback
```bash
# Rollback staging
./scripts/rollback.sh staging

# Rollback production
./scripts/rollback.sh prod
```

## Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

## Prerequisites
- `gcloud` CLI installed and authenticated
- `tofu` (OpenTofu) installed
- `docker` installed
- Git repository initialized
- Terraform configs in `terraform/` directory
- Environment tfvars in `terraform/environments/`

## Integration with CI/CD

These scripts can be used manually OR integrated into GitHub Actions:

```yaml
# Manual deployment trigger
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - prod

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy infrastructure
        run: ./scripts/deploy-infra.sh ${{ github.event.inputs.environment }}
      - name: Deploy application
        run: ./scripts/deploy-app.sh ${{ github.event.inputs.environment }}
```

## Expected Effort
⏱️ **1 hour** - Write scripts, test on staging
