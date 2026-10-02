variable "machine_type" {
  type        = string
  description = "GCP Compute Engine machine type for Management Server"
  default     = "e2-medium" # 2 vCPU, 4 GB RAM (~$25/mo)
}

variable "zone" {
  type        = string
  description = "GCP Zone for VM instances"
  default     = "europe-west3-a"
}

variable "gcp_project_id" {
  type        = string
  description = "GCP Project ID"
  default     = "coredb-idp"
}

variable "region" {
  type        = string
  description = "GCP Region for deployment"
  default     = "europe-west3"  
}
