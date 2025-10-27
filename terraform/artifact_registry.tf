resource "google_artifact_registry_repository" "interlinear" {
  location      = var.region
  repository_id = "interlinear"
  format        = "DOCKER"

  description = "Container images for Interlinear app"
}
