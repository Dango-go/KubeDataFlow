resource "aws_ecr_repository" "microservices_repo" {
  name                 = "idp-microservices"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "idp-microservices"
  }
}

resource "aws_ebs_volume" "data_disk" {
  availability_zone = aws_subnet.subnet.availability_zone
  size              = 30
  type              = "gp3"

  tags = {
    Name = "${var.prefix}-data-disk"
  }
}

resource "aws_volume_attachment" "disk_attachment" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.data_disk.id
  instance_id = aws_instance.idp_server.id
}
