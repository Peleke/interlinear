resource "google_service_account" "cloud_run" {
  account_id   = "interlinear-${var.environment}"
  display_name = "Cloud Run Service Account - ${var.environment}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
