terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "interlinear-tfstate"
    prefix = "interlinear"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
