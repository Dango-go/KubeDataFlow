variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployment"
}

variable "prefix" {
  type        = string
  default     = "idp-core"
  description = "Prefix for resource names"
}

variable "instance_type" {
  type        = string
  default     = "t2.medium"
  description = "AWS EC2 instance type for Management Server"
}

variable "allowed_cidr" {
  type        = string
  default     = "46.150.88.240/32"
  description = "Allowed IP address range for SSH and web traffic"
}

variable "ssh_public_key_path" {
  type        = string
  default     = "~/.ssh/aws/development/id_rsa.pub"
  description = "Path to public SSH key"
}

variable "cluster_name" {
  type        = string
  default     = "test-eks"
  description = "Name of the EKS cluster"
}