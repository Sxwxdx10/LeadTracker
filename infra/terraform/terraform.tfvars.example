# Lead Tracker Infrastructure Configuration
# Copy this file to terraform.tfvars and update the values

# Environment Configuration
environment = "dev"  # dev, staging, production
location    = "West Europe"
owner       = "leadtracker-team"

# Database Configuration
db_admin_username = "leadtracker_admin"
db_sku_name      = "B_Standard_B1ms"  # B_Standard_B1ms, GP_Standard_D2s_v3, GP_Standard_D4s_v3
db_storage_mb    = 32768              # 32GB minimum
db_storage_tier  = "P6"               # P4, P6, P10, P15, P20, P30, P40, P50

# High Availability Configuration (production)
availability_zone         = "1"  # 1, 2, 3
standby_availability_zone = "2"  # 1, 2, 3 (different from primary)

# Redis Configuration
redis_sku_name           = "Basic"     # Basic, Standard, Premium
redis_family            = "C"          # C (Basic/Standard), P (Premium)
redis_capacity          = 0           # 0-6
redis_maxmemory_reserved = 2          # MB
redis_maxmemory_delta    = 2          # MB

# App Service Configuration
app_service_sku          = "B1"        # B1, B2, B3, S1, S2, S3, P1v2, P2v2, P3v2, P1v3, P2v3, P3v3
app_service_min_instances = 1          # Minimum instances for auto-scaling
app_service_max_instances = 3          # Maximum instances for auto-scaling

# Container Registry Geo-replication (production only)
geo_replications = [
  # {
  #   location                = "North Europe"
  #   zone_redundancy_enabled = true
  # }
]

# Common Tags
common_tags = {
  CostCenter = "IT"
  Owner      = "leadtracker-team"
  Project    = "lead-tracker"
  # Add more tags as needed
}

# Environment-specific examples:

# Development Environment
# environment = "dev"
# db_sku_name = "B_Standard_B1ms"
# db_storage_mb = 32768
# redis_sku_name = "Basic"
# redis_capacity = 0
# app_service_sku = "B1"

# Staging Environment
# environment = "staging"
# db_sku_name = "GP_Standard_D2s_v3"
# db_storage_mb = 65536
# redis_sku_name = "Standard"
# redis_capacity = 1
# app_service_sku = "S1"

# Production Environment
# environment = "production"
# db_sku_name = "GP_Standard_D4s_v3"
# db_storage_mb = 131072
# redis_sku_name = "Premium"
# redis_capacity = 2
# app_service_sku = "P2v3"
# app_service_min_instances = 2
# app_service_max_instances = 10
# geo_replications = [
#   {
#     location                = "North Europe"
#     zone_redundancy_enabled = true
#   }
# ]
