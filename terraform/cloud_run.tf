resource "google_cloud_run_v2_service" "interlinear" {
  count    = var.deploy_cloud_run ? 1 : 0
  name     = "interlinear-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/interlinear/app:${var.image_tag}"

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

      env {
        name = "MERRIAM_WEBSTER_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.merriam_webster_key.id
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
  count    = var.deploy_cloud_run ? 1 : 0
  name     = google_cloud_run_v2_service.interlinear[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
