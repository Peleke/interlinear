output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = var.deploy_cloud_run ? google_cloud_run_v2_service.interlinear[0].uri : "Not deployed (run with --with-cloud-run)"
}

output "artifact_registry" {
  description = "Artifact Registry repository"
  value       = google_artifact_registry_repository.interlinear.name
}

output "service_account" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}
