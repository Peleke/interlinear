# Deployment Architecture

## Deployment Strategy

**Platform:** Google Cloud Run (Serverless Container)

**Rationale:**
- Serverless execution model - pay only for actual usage
- Automatic scaling from 0 to N instances
- Built-in HTTPS with custom domain support
- Integrates seamlessly with GCP Secret Manager
- No infrastructure management overhead

**Deployment Model:**
- Single container running Next.js 15 in production mode
- Container serves both frontend (Server Components) and backend (API Routes)
- Stateless architecture enables horizontal scaling
- Environment-specific configuration via environment variables

---

## Infrastructure as Code (OpenTofu)

**Tool:** OpenTofu 1.6+ (open-source Terraform alternative)

**GitOps Workflow:** Terrateam

Terrateam provides GitHub-native GitOps for infrastructure management:
- **Plan on PR:** Automatically runs `tofu plan` when infrastructure PRs are opened
- **Review in PR:** Plan output posted as PR comment showing resource changes
- **Apply on Command:** Merge PR and comment `terrateam apply` to execute changes
- **Lock Management:** Prevents concurrent modifications to the same resources
- **Apply Requirements:** Enforces PR approvals and status checks before apply

**Directory Structure:**
```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── ...
│   └── prod/
│       └── ...
├── modules/
│   ├── cloud-run/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── secrets/
│       └── ...
├── scripts/
│   ├── bootstrap-project.sh   # GCP project setup (TBD)
│   └── bootstrap-secrets.sh   # Secrets initialization (TBD)
└── .terrateam/
    └── config.yml              # Terrateam configuration
```

**Core Resources (OpenTofu):**

```hcl
# infrastructure/modules/cloud-run/main.tf
resource "google_cloud_run_v2_service" "interlinear" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.container_image

      ports {
        container_port = 3000
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "NEXT_PUBLIC_SUPABASE_URL"
        value = var.supabase_url
      }

      env {
        name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_anon_key.id
            version = "latest"
          }
        }
      }

      env {
        name = "MERRIAM_WEBSTER_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.merriam_webster_key.id
            version = "latest"
          }
        }
      }

      env {
        name = "ELEVENLABS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.elevenlabs_key.id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Allow unauthenticated access (public app)
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.interlinear.name
  location = google_cloud_run_v2_service.interlinear.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url" {
  value = google_cloud_run_v2_service.interlinear.uri
}
```

**Terrateam Configuration:**

```yaml
# .terrateam/config.yml
apply_requirements:
  - approved                    # PR must be approved
  - status_checks               # CI checks must pass

workflows:
  plan:
    tag_query: "plan"
    environment:
      TERRATEAM_LOG_LEVEL: info

  apply:
    tag_query: "apply"
    environment:
      TERRATEAM_LOG_LEVEL: info

storage:
  gcp:
    bucket: "interlinear-terrateam-state"
    prefix: "terraform/state"
```

---

## Containerization (Docker)

**Dockerfile (Multi-stage Build):**

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**next.config.js (for standalone output):**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}

module.exports = nextConfig
```

---

## CI/CD Pipeline (GitHub Actions)

**Workflow: Build, Test, and Deploy**

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION: us-central1
  SERVICE_NAME: interlinear
  REGISTRY: us-central1-docker.pkg.dev

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run build
        run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.GCP_REGION }}-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build \
            -t ${{ env.REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
            -t ${{ env.REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}:latest \
            .

      - name: Push Docker image
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}:latest

      - name: Output image digest
        id: image
        run: |
          echo "digest=${{ env.REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT

    outputs:
      image_digest: ${{ steps.image.outputs.digest }}

  # Infrastructure changes are managed by Terrateam via PR comments
  # This job only runs manual deployments when needed
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy notification
        run: |
          echo "✅ Docker image built and pushed successfully"
          echo "🚀 To deploy infrastructure changes, use Terrateam in the infrastructure PR"
          echo "📦 Image: ${{ needs.build-and-push.outputs.image_digest }}"
```

---

## Environments

| Environment | Purpose | Min Instances | Max Instances | Domain |
|-------------|---------|---------------|---------------|--------|
| **Development** | Local development | 0 (local) | 1 (local) | `localhost:3000` |
| **Staging** | Pre-production testing | 0 | 3 | `staging.interlinear.app` (TBD) |
| **Production** | Live user-facing app | 1 | 10 | `interlinear.app` (TBD) |

**Environment-Specific Configuration:**

```hcl
# infrastructure/environments/prod/terraform.tfvars
environment      = "production"
service_name     = "interlinear-prod"
region           = "us-central1"
min_instances    = 1
max_instances    = 10
supabase_url     = "https://your-project.supabase.co"

# infrastructure/environments/staging/terraform.tfvars
environment      = "staging"
service_name     = "interlinear-staging"
region           = "us-central1"
min_instances    = 0
max_instances    = 3
supabase_url     = "https://your-staging-project.supabase.co"
```

---

## Secrets Management

**GCP Secret Manager:**

All sensitive credentials stored in Secret Manager and injected as environment variables:

1. `supabase-anon-key` - Supabase anonymous key
2. `merriam-webster-api-key` - Dictionary API key
3. `elevenlabs-api-key` - TTS API key

**Bootstrap Script (Placeholder):**

```bash
#!/bin/bash
# infrastructure/scripts/bootstrap-secrets.sh
# This script will be provided with actual values later

set -e

PROJECT_ID="${GCP_PROJECT_ID}"
ENVIRONMENT="${1:-dev}"

echo "🔐 Bootstrapping secrets for ${ENVIRONMENT}..."

# Create secrets (placeholders - actual values to be provided)
gcloud secrets create supabase-anon-key \
  --project="${PROJECT_ID}" \
  --replication-policy="automatic" \
  --data-file=- <<< "placeholder-key"

gcloud secrets create merriam-webster-api-key \
  --project="${PROJECT_ID}" \
  --replication-policy="automatic" \
  --data-file=- <<< "placeholder-key"

gcloud secrets create elevenlabs-api-key \
  --project="${PROJECT_ID}" \
  --replication-policy="automatic" \
  --data-file=- <<< "placeholder-key"

echo "✅ Secrets bootstrapped successfully"
echo "⚠️  Remember to update with actual values!"
```

---

## Deployment Workflow

**Standard Deployment Process:**

1. **Code Changes (Application):**
   - Developer creates feature branch
   - GitHub Actions runs tests on PR
   - Merge to `main` → Docker image built and pushed
   - Image available for infrastructure deployment

2. **Infrastructure Changes (OpenTofu):**
   - Developer creates infrastructure PR
   - Terrateam automatically runs `tofu plan`
   - Plan output posted as PR comment
   - Team reviews infrastructure changes
   - PR approved and merged
   - Team member comments `terrateam apply`
   - Terrateam executes infrastructure changes
   - Cloud Run updated with new image or configuration

3. **Rollback:**
   - Revert infrastructure PR to previous known-good state
   - Terrateam applies rollback
   - Or manually update Cloud Run to previous image tag

---

## Bootstrap Process (High-Level)

**Initial GCP Project Setup:**

1. Run `infrastructure/scripts/bootstrap-project.sh` (TBD)
   - Enable required GCP APIs (Cloud Run, Secret Manager, Artifact Registry)
   - Create service accounts
   - Set up Workload Identity Federation for GitHub Actions

2. Run `infrastructure/scripts/bootstrap-secrets.sh` (TBD)
   - Create placeholder secrets in Secret Manager
   - Update with actual API keys

3. Initialize Terrateam:
   - Install Terrateam GitHub App
   - Configure `.terrateam/config.yml`
   - Create GCS bucket for Terrateam state

4. First Infrastructure Deployment:
   - Create PR with OpenTofu code
   - Review plan output
   - Merge and apply
   - Cloud Run service deployed

---
