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

output "github_actions_sa_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "github_actions_sa_key" {
  description = "GitHub Actions service account key (base64-encoded JSON) - Add this to GitHub Secrets as GCP_SA_KEY"
  value       = google_service_account_key.github_actions.private_key
  sensitive   = true
}

output "custom_domain" {
  description = "Custom domain URL (if configured)"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "No custom domain configured"
}

output "domain_dns_records" {
  description = "DNS records to add to your domain registrar (Namecheap). Add these CNAME records after deployment."
  value = var.deploy_cloud_run && var.custom_domain != "" ? {
    status = "Domain mapping created. Run 'gcloud run domain-mappings describe --domain=${var.custom_domain} --region=${var.region}' to get DNS records"
  } : {
    status = "No domain mapping configured"
  }
}
