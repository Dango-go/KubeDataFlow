data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "${var.prefix}-key"
  public_key = fileexists(pathexpand(var.ssh_public_key_path)) ? file(pathexpand(var.ssh_public_key_path)) : "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCdummykeyidp"
}

resource "aws_instance" "idp_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.subnet.id
  vpc_security_group_ids = [aws_security_group.sg.id]
  key_name               = aws_key_pair.deployer.key_name

  root_block_device {
    volume_size           = 35
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
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

  tags = {
    Name = "${var.prefix}-management-server"
  }
}

output "instance_public_ip" {
  value       = aws_instance.idp_server.public_ip
  description = "Public IP address of the IDP Management Server"
}

output "instance_id" {
  value       = aws_instance.idp_server.id
  description = "EC2 Instance ID"
}
