variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "West Europe"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "leadtracker-team"
}

# Database Configuration
variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "leadtracker_admin"
}

variable "db_sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "B_Standard_B1ms"
  
  validation {
    condition = contains([
      "B_Standard_B1ms", "B_Standard_B2s", "B_Standard_B4ms",
      "GP_Standard_D2s_v3", "GP_Standard_D4s_v3", "GP_Standard_D8s_v3",
      "MO_Standard_E4s_v3", "MO_Standard_E8s_v3", "MO_Standard_E16s_v3"
    ], var.db_sku_name)
    error_message = "Invalid PostgreSQL SKU name."
  }
}

variable "db_storage_mb" {
  description = "PostgreSQL storage size in MB"
  type        = number
  default     = 32768
  
  validation {
    condition     = var.db_storage_mb >= 32768 && var.db_storage_mb <= 16777216
    error_message = "Storage size must be between 32GB and 16TB."
  }
}

variable "db_storage_tier" {
  description = "PostgreSQL storage tier"
  type        = string
  default     = "P6"
  
  validation {
    condition     = contains(["P4", "P6", "P10", "P15", "P20", "P30", "P40", "P50"], var.db_storage_tier)
    error_message = "Invalid storage tier."
  }
}

variable "availability_zone" {
  description = "Availability zone for PostgreSQL"
  type        = string
  default     = "1"
  
  validation {
    condition     = contains(["1", "2", "3"], var.availability_zone)
    error_message = "Availability zone must be 1, 2, or 3."
  }
}

variable "standby_availability_zone" {
  description = "Standby availability zone for PostgreSQL HA"
  type        = string
  default     = "2"
  
  validation {
    condition     = contains(["1", "2", "3"], var.standby_availability_zone)
    error_message = "Standby availability zone must be 1, 2, or 3."
  }
}

# Redis Configuration
variable "redis_sku_name" {
  description = "Redis SKU name"
  type        = string
  default     = "Basic"
  
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku_name)
    error_message = "Redis SKU must be Basic, Standard, or Premium."
  }
}

variable "redis_family" {
  description = "Redis family"
  type        = string
  default     = "C"
  
  validation {
    condition     = contains(["C", "P"], var.redis_family)
    error_message = "Redis family must be C or P."
  }
}

variable "redis_capacity" {
  description = "Redis capacity"
  type        = number
  default     = 0
  
  validation {
    condition     = var.redis_capacity >= 0 && var.redis_capacity <= 6
    error_message = "Redis capacity must be between 0 and 6."
  }
}

variable "redis_maxmemory_reserved" {
  description = "Redis maxmemory reserved"
  type        = number
  default     = 2
}

variable "redis_maxmemory_delta" {
  description = "Redis maxmemory delta"
  type        = number
  default     = 2
}

# App Service Configuration
variable "app_service_sku" {
  description = "App Service plan SKU"
  type        = string
  default     = "B1"
  
  validation {
    condition = contains([
      "B1", "B2", "B3",
      "S1", "S2", "S3",
      "P1v2", "P2v2", "P3v2",
      "P1v3", "P2v3", "P3v3"
    ], var.app_service_sku)
    error_message = "Invalid App Service SKU."
  }
}

variable "app_service_min_instances" {
  description = "Minimum number of App Service instances"
  type        = number
  default     = 1
  
  validation {
    condition     = var.app_service_min_instances >= 1 && var.app_service_min_instances <= 100
    error_message = "Minimum instances must be between 1 and 100."
  }
}

variable "app_service_max_instances" {
  description = "Maximum number of App Service instances"
  type        = number
  default     = 3
  
  validation {
    condition     = var.app_service_max_instances >= 1 && var.app_service_max_instances <= 100
    error_message = "Maximum instances must be between 1 and 100."
  }
}

# Container Registry Geo-replication
variable "geo_replications" {
  description = "List of geo-replication locations for Container Registry"
  type = list(object({
    location                = string
    zone_redundancy_enabled = bool
  }))
  default = []
}

# Environment-specific defaults
locals {
  environment_config = {
    dev = {
      db_sku_name               = "B_Standard_B1ms"
      db_storage_mb            = 32768
      redis_sku_name           = "Basic"
      redis_capacity           = 0
      app_service_sku          = "B1"
      app_service_min_instances = 1
      app_service_max_instances = 2
    }
    
    staging = {
      db_sku_name               = "GP_Standard_D2s_v3"
      db_storage_mb            = 65536
      redis_sku_name           = "Standard"
      redis_capacity           = 1
      app_service_sku          = "S1"
      app_service_min_instances = 1
      app_service_max_instances = 3
    }
    
    production = {
      db_sku_name               = "GP_Standard_D4s_v3"
      db_storage_mb            = 131072
      redis_sku_name           = "Premium"
      redis_capacity           = 2
      app_service_sku          = "P2v3"
      app_service_min_instances = 2
      app_service_max_instances = 10
      geo_replications = [
        {
          location                = "North Europe"
          zone_redundancy_enabled = true
        }
      ]
    }
  }
  
  # Merge environment-specific config with variables
  config = merge(
    local.environment_config[var.environment],
    {
      environment = var.environment
      location    = var.location
      owner       = var.owner
    }
  )
}

# Computed values
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(
    {
      Environment = var.environment
      Application = "LeadTracker"
      ManagedBy   = "Terraform"
      Owner       = var.owner
      Project     = "lead-tracker"
    },
    var.common_tags
  )
}
