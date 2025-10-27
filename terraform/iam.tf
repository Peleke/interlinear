# Cloud Run Service Account
resource "google_service_account" "cloud_run" {
  account_id   = "interlinear-${var.environment}"
  display_name = "Cloud Run Service Account - ${var.environment}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# GitHub Actions Service Account (environment-specific)
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-${var.environment}"
  display_name = "GitHub Actions CI/CD - ${var.environment}"
}

# Grant Artifact Registry Writer for container pushes
resource "google_project_iam_member" "github_actions_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant Storage Admin for GCS state bucket access (if needed)
resource "google_project_iam_member" "github_actions_storage" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Generate service account key for GitHub Actions
resource "google_service_account_key" "github_actions" {
  service_account_id = google_service_account.github_actions.name
}
