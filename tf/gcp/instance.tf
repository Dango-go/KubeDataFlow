resource "google_compute_instance" "idp_server" {
  name         = "idp-management-server"
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 35 
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id

    access_config { # Ephemeral IP
    }
  }

  metadata = {
    ssh-keys = "ubuntu:${file("~/.ssh/gcp/development/dev.pub")}"
    startup-script = <<-EOF
      #!/bin/bash
      set -e

      # 1. Update system packages
      apt-get update -y
      apt-get install -y ca-certificates curl gnupg lsb-release git

      # 2. Install Docker & Docker Compose
      mkdir -p /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

      apt-get update -y
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

      # 3. Enable & Start Docker
      systemctl enable docker
      systemctl start docker
      usermod -aG docker ubuntu || true

    EOF
  }

  service_account {
    scopes = ["cloud-platform"]
  }
}

resource "google_compute_disk" "data_disk" {
  name  = "idp-management-data-disk"
  type  = "pd-standard"  
  zone  =  var.zone
  size  = 20  
}

resource "google_compute_attached_disk" "attachment" {
  disk     = google_compute_disk.data_disk.id
  instance = "idp-management-server"  
}


output "instance_public_ip" {
  value       = google_compute_instance.idp_server.network_interface[0].access_config[0].nat_ip
  description = "Public IP address of the IDP Management Server"
}

output "instance_name" {
  value       = google_compute_instance.idp_server.name
  description = "Compute Engine VM Instance Name"
}

