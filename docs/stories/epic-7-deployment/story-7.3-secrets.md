# Story 7.3: Secret Manager Setup

## Summary
Configure Google Secret Manager for API keys and sensitive environment variables.

## Acceptance Criteria
- Secrets created in Secret Manager
- IAM permissions configured
- OpenTofu integration
- Local development fallback

## Secrets Needed
1. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `ELEVENLABS_API_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY` (if needed for admin ops)

## OpenTofu Configuration

### secrets.tf
```hcl
# ElevenLabs API Key
resource "google_secret_manager_secret" "elevenlabs_key" {
  secret_id = "elevenlabs-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "elevenlabs_key" {
  secret      = google_secret_manager_secret.elevenlabs_key.id
  secret_data = var.elevenlabs_api_key
}

# Supabase Anon Key
resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "supabase_anon_key" {
  secret      = google_secret_manager_secret.supabase_anon_key.id
  secret_data = var.supabase_anon_key
}

# Grant Cloud Run service account access
resource "google_secret_manager_secret_iam_member" "elevenlabs_accessor" {
  secret_id = google_secret_manager_secret.elevenlabs_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "supabase_accessor" {
  secret_id = google_secret_manager_secret.supabase_anon_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

### variables.tf additions
```hcl
variable "elevenlabs_api_key" {
  description = "ElevenLabs API key"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}
```

## Manual Secret Creation (Alternative)
```bash
# Create secrets via gcloud
echo -n "your-elevenlabs-key" | gcloud secrets create elevenlabs-api-key \
  --data-file=- \
  --replication-policy="automatic"

echo -n "your-supabase-key" | gcloud secrets create supabase-anon-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding elevenlabs-api-key \
  --member="serviceAccount:interlinear-cloud-run@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## terraform.tfvars (gitignored)
```hcl
project_id         = "your-gcp-project"
region             = "us-central1"
supabase_url       = "https://xxx.supabase.co"
supabase_anon_key  = "eyJxxx..."
elevenlabs_api_key = "sk_xxx..."
```

## .gitignore additions
```
terraform/*.tfvars
terraform/.terraform/
terraform/.terraform.lock.hcl
terraform/terraform.tfstate*
```

## Expected Effort
⏱️ **30 minutes** - Create secrets, configure access
