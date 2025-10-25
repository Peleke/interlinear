# Deployment Requirements

## Environment Variables

**Local Development (`.env.local`):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Merriam-Webster
MERRIAM_WEBSTER_API_KEY=your-api-key-here

# ElevenLabs
ELEVENLABS_API_KEY=your-api-key-here

# Optional: Anthropic (Phase 2)
# ANTHROPIC_API_KEY=sk-ant-...
```

**Production (Cloud Run Secrets):**
- Set via Google Secret Manager
- Reference in OpenTofu config
- Never commit to Git

---

## Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

## OpenTofu Configuration

```hcl
# infrastructure/main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run Service
resource "google_cloud_run_service" "interlinear" {
  name     = "interlinear"
  location = var.region

  template {
    spec {
      containers {
        image = var.container_image

        env {
          name  = "NEXT_PUBLIC_SUPABASE_URL"
          value = var.supabase_url
        }

        env {
          name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value = var.supabase_anon_key
        }

        env {
          name = "MERRIAM_WEBSTER_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.merriam_webster_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "ELEVENLABS_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.elevenlabs_key.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow unauthenticated access
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.interlinear.name
  location = google_cloud_run_service.interlinear.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secrets
resource "google_secret_manager_secret" "merriam_webster_key" {
  secret_id = "merriam-webster-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "elevenlabs_key" {
  secret_id = "elevenlabs-api-key"

  replication {
    auto {}
  }
}

# Outputs
output "service_url" {
  value = google_cloud_run_service.interlinear.status[0].url
}
```

**Variables (`variables.tf`):**
```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "container_image" {
  description = "Container image URL"
  type        = string
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon key"
  type        = string
}
```

---

## GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: interlinear

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      # - run: npm test (if tests exist)

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build Docker image
        run: |
          docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA .
          docker tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --set-env-vars NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --set-env-vars NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }} \
            --set-secrets MERRIAM_WEBSTER_API_KEY=merriam-webster-api-key:latest \
            --set-secrets ELEVENLABS_API_KEY=elevenlabs-api-key:latest

      - name: Get Service URL
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
          echo "Service deployed to: $SERVICE_URL"
          echo "SERVICE_URL=$SERVICE_URL" >> $GITHUB_ENV

      - name: Smoke Test
        run: |
          curl -f $SERVICE_URL || exit 1
```

---
