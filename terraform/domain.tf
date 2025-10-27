# Custom domain mapping for Cloud Run
resource "google_cloud_run_domain_mapping" "interlinear" {
  count    = var.deploy_cloud_run && var.custom_domain != "" ? 1 : 0
  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.interlinear[0].name
  }
}
