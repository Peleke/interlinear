# Story 7.2: OpenTofu Infrastructure Configuration

## Summary
Define Cloud Run service, Artifact Registry, and IAM with OpenTofu IaC for staging + prod environments.

## Acceptance Criteria
- Cloud Run service configuration
- Artifact Registry for container images
- IAM roles and service accounts
- Environment-specific tfvars (staging/prod)
- Local state file (simple setup)

## Directory Structure
```
terraform/
├── main.tf              # Provider & backend config
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── cloud_run.tf         # Cloud Run service
├── artifact_registry.tf # Container registry
├── iam.tf              # Service accounts & roles
├── secrets.tf          # Secret Manager resources
└── environments/
    ├── staging.tfvars   # Staging variables
    └── prod.tfvars      # Production variables
```

## main.tf
```hcl
terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "YOUR_SHARED_TFSTATE_BUCKET"
    prefix = "interlinear"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

## cloud_run.tf
```hcl
resource "google_cloud_run_v2_service" "interlinear" {
  name     = "interlinear-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/interlinear/app:latest"

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
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      ports {
        container_port = 3000
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

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.interlinear.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

## artifact_registry.tf
```hcl
resource "google_artifact_registry_repository" "interlinear" {
  location      = var.region
  repository_id = "interlinear"
  format        = "DOCKER"

  description = "Container images for Interlinear app"
}
```

## iam.tf
```hcl
resource "google_service_account" "cloud_run" {
  account_id   = "interlinear-${var.environment}"
  display_name = "Cloud Run Service Account - ${var.environment}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

## secrets.tf
```hcl
# Supabase anon key secret
resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key-${var.environment}"

  replication {
    auto {}
  }
}

# ElevenLabs API key secret
resource "google_secret_manager_secret" "elevenlabs_key" {
  secret_id = "elevenlabs-api-key-${var.environment}"

  replication {
    auto {}
  }
}
```

## variables.tf
```hcl
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (staging or prod)"
  type        = string
  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "Environment must be staging or prod"
  }
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

# Resource configuration
variable "cpu_limit" {
  description = "CPU limit for Cloud Run"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}
```

## environments/staging.tfvars
```hcl
environment     = "staging"
project_id      = "YOUR_PROJECT_ID"
region          = "us-central1"
supabase_url    = "https://your-staging-project.supabase.co"

# Smaller resources for staging
cpu_limit       = "1"
memory_limit    = "512Mi"
min_instances   = 0
max_instances   = 3
```

## environments/prod.tfvars
```hcl
environment     = "prod"
project_id      = "YOUR_PROJECT_ID"
region          = "us-central1"
supabase_url    = "https://your-prod-project.supabase.co"

# Production resources
cpu_limit       = "2"
memory_limit    = "1Gi"
min_instances   = 1
max_instances   = 10
```

## outputs.tf
```hcl
output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.interlinear.uri
}

output "artifact_registry" {
  description = "Artifact Registry repository"
  value       = google_artifact_registry_repository.interlinear.name
}
```

## Usage

### Deploy to Staging
```bash
cd terraform

# Initialize (first time only)
tofu init

# Plan staging changes
tofu plan -var-file=environments/staging.tfvars

# Apply to staging
tofu apply -var-file=environments/staging.tfvars
```

### Deploy to Production
```bash
cd terraform

# Plan production changes
tofu plan -var-file=environments/prod.tfvars

# Apply to production
tofu apply -var-file=environments/prod.tfvars
```

### Migrating from Local to Remote State
```bash
# If you already have local state, migrate it:
cd terraform
tofu init -migrate-state

# Tofu will detect the backend change and prompt to migrate
# Type 'yes' to copy local state to GCS bucket
```

## Expected Effort
⏱️ **2 hours** - Write OpenTofu configs, test apply to both environments
