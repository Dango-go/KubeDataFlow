resource "google_artifact_registry_repository" "microservices_repo" {
  location      = var.region
  repository_id = "idp-microservices"
  description   = "Docker repository for IDP microservices images"
  format        = "DOCKER"
}