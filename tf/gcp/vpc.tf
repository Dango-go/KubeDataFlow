resource "google_compute_network" "vpc_network" {
  name                    = "idp-core-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "idp-core-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
  private_ip_google_access = true
}


# Firewall rule: Allow SSH, HTTP, HTTPS, Web UI (3000) & API traffic
resource "google_compute_firewall" "allowed_traffic" {
  name    = "idp-allow-ingress"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3000"]
  }

  source_ranges = ["46.150.88.240/32"]
}
