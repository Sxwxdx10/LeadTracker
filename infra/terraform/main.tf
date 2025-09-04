terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }
  
  backend "azurerm" {
    # Configure backend storage account
    # resource_group_name  = "leadtracker-tfstate-rg"
    # storage_account_name = "leadtrackertfstate"
    # container_name       = "tfstate"
    # key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Random password generation
resource "random_password" "db_admin_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "leadtracker-${var.environment}-rg"
  location = var.location
  
  tags = {
    Environment = var.environment
    Application = "LeadTracker"
    ManagedBy   = "Terraform"
    Owner       = var.owner
    Project     = "lead-tracker"
  }
}

# Key Vault for secrets management
resource "azurerm_key_vault" "main" {
  name                = "leadtracker-${var.environment}-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id          = data.azurerm_client_config.current.tenant_id
  
  sku_name = "standard"
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    key_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Recover", "Purge"
    ]
    
    secret_permissions = [
      "Get", "List", "Set", "Delete", "Recover", "Purge"
    ]
    
    certificate_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Import"
    ]
  }
  
  tags = azurerm_resource_group.main.tags
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "db_admin_password" {
  name         = "db-admin-password"
  value        = random_password.db_admin_password.result
  key_vault_id = azurerm_key_vault.main.id
  
  tags = azurerm_resource_group.main.tags
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret-key"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id
  
  tags = azurerm_resource_group.main.tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "leadtracker-${var.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  tags = azurerm_resource_group.main.tags
}

# Subnets
resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
  
  delegation {
    name = "app-service-delegation"
    
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "db" {
  name                 = "db-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
  
  delegation {
    name = "postgresql-delegation"
    
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Network Security Group for database subnet
resource "azurerm_network_security_group" "db" {
  name                = "leadtracker-${var.environment}-db-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  security_rule {
    name                       = "AllowPostgreSQL"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.1.0/24"
    destination_address_prefix = "*"
  }
  
  tags = azurerm_resource_group.main.tags
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "leadtracker${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.environment == "production" ? "Premium" : "Standard"
  admin_enabled       = true
  
  # Enable geo-replication for production
  dynamic "georeplications" {
    for_each = var.environment == "production" ? var.geo_replications : []
    content {
      location                = georeplications.value.location
      zone_redundancy_enabled = georeplications.value.zone_redundancy_enabled
      tags                    = azurerm_resource_group.main.tags
    }
  }
  
  tags = azurerm_resource_group.main.tags
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "leadtracker-${var.environment}-db"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "15"
  delegated_subnet_id   = azurerm_subnet.db.id
  private_dns_zone_id   = azurerm_private_dns_zone.db.id
  
  administrator_login    = var.db_admin_username
  administrator_password = random_password.db_admin_password.result
  
  zone = var.availability_zone
  
  storage_mb   = var.db_storage_mb
  storage_tier = var.db_storage_tier
  
  sku_name = var.db_sku_name
  
  backup_retention_days        = var.environment == "production" ? 35 : 7
  geo_redundant_backup_enabled = var.environment == "production"
  
  high_availability {
    mode                      = var.environment == "production" ? "ZoneRedundant" : "Disabled"
    standby_availability_zone = var.environment == "production" ? var.standby_availability_zone : null
  }
  
  maintenance_window {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }
  
  tags = azurerm_resource_group.main.tags
  
  depends_on = [azurerm_private_dns_zone_virtual_network_link.db]
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "db" {
  name                = "leadtracker-${var.environment}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
  
  tags = azurerm_resource_group.main.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "db" {
  name                  = "leadtracker-${var.environment}-db-link"
  private_dns_zone_name = azurerm_private_dns_zone.db.name
  virtual_network_id    = azurerm_virtual_network.main.id
  resource_group_name   = azurerm_resource_group.main.name
  
  tags = azurerm_resource_group.main.tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "leadtracker"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "leadtracker-${var.environment}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  
  # Redis configuration
  redis_configuration {
    enable_authentication = true
    maxmemory_reserved     = var.redis_maxmemory_reserved
    maxmemory_delta        = var.redis_maxmemory_delta
    maxmemory_policy       = "allkeys-lru"
  }
  
  # Backup configuration for Premium tier
  dynamic "patch_schedule" {
    for_each = var.redis_sku_name == "Premium" ? [1] : []
    content {
      day_of_week    = "Sunday"
      start_hour_utc = 2
    }
  }
  
  tags = azurerm_resource_group.main.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "leadtracker-${var.environment}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  os_type  = "Linux"
  sku_name = var.app_service_sku
  
  # Auto-scaling for production
  dynamic "worker_count" {
    for_each = var.environment == "production" ? [1] : []
    content {
      minimum = var.app_service_min_instances
      maximum = var.app_service_max_instances
    }
  }
  
  tags = azurerm_resource_group.main.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "leadtracker-${var.environment}-ai"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type   = "web"
  
  retention_in_days = var.environment == "production" ? 90 : 30
  
  tags = azurerm_resource_group.main.tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "leadtracker-${var.environment}-law"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = "PerGB2018"
  retention_in_days  = var.environment == "production" ? 90 : 30
  
  tags = azurerm_resource_group.main.tags
}

# Storage Account for file uploads
resource "azurerm_storage_account" "main" {
  name                     = "leadtracker${var.environment}sa"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"
  
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["DELETE", "GET", "HEAD", "MERGE", "POST", "OPTIONS", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 200
    }
    
    delete_retention_policy {
      days = var.environment == "production" ? 30 : 7
    }
  }
  
  tags = azurerm_resource_group.main.tags
}

# Storage Container for uploads
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# CDN Profile for static assets (production only)
resource "azurerm_cdn_profile" "main" {
  count               = var.environment == "production" ? 1 : 0
  name                = "leadtracker-${var.environment}-cdn"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = "Standard_Microsoft"
  
  tags = azurerm_resource_group.main.tags
}
