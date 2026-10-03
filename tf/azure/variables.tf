variable "location" {
  type        = string
  default     = "eastus" # francecentral
  description = "Azure region for resources"
}

variable "resource_group_name" {
  type        = string
  default     = "rg-medium-instance"
  description = "Name of the resource group"
}

variable "prefix" {
  type        = string
  default     = "development"
  description = "Prefix for resource names"
}