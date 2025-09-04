output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "location" {
  description = "Azure region where resources are deployed"
  value       = azurerm_resource_group.main.location
}

# Database outputs
output "postgresql_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgresql_database_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "postgresql_admin_username" {
  description = "PostgreSQL administrator username"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
  sensitive   = true
}

output "postgresql_connection_string" {
  description = "PostgreSQL connection string"
  value       = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=${azurerm_postgresql_flexible_server_database.main.name};Username=${azurerm_postgresql_flexible_server.main.administrator_login};Password=${random_password.db_admin_password.result};SSL Mode=Require;"
  sensitive   = true
}

# Redis outputs
output "redis_hostname" {
  description = "Redis hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_port" {
  description = "Redis SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
  sensitive   = true
}

# Container Registry outputs
output "container_registry_name" {
  description = "Container Registry name"
  value       = azurerm_container_registry.main.name
}

output "container_registry_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "container_registry_admin_username" {
  description = "Container Registry admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "container_registry_admin_password" {
  description = "Container Registry admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

# App Service outputs
output "app_service_plan_name" {
  description = "App Service Plan name"
  value       = azurerm_service_plan.main.name
}

output "app_service_plan_id" {
  description = "App Service Plan ID"
  value       = azurerm_service_plan.main.id
}

# Application Insights outputs
output "application_insights_name" {
  description = "Application Insights name"
  value       = azurerm_application_insights.main.name
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

# Storage outputs
output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "storage_account_primary_connection_string" {
  description = "Storage account primary connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "storage_account_primary_access_key" {
  description = "Storage account primary access key"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

# Key Vault outputs
output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# Network outputs
output "virtual_network_name" {
  description = "Virtual Network name"
  value       = azurerm_virtual_network.main.name
}

output "virtual_network_id" {
  description = "Virtual Network ID"
  value       = azurerm_virtual_network.main.id
}

output "app_subnet_id" {
  description = "App subnet ID"
  value       = azurerm_subnet.app.id
}

output "db_subnet_id" {
  description = "Database subnet ID"
  value       = azurerm_subnet.db.id
}

# Log Analytics outputs
output "log_analytics_workspace_name" {
  description = "Log Analytics Workspace name"
  value       = azurerm_log_analytics_workspace.main.name
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

# CDN outputs (production only)
output "cdn_profile_name" {
  description = "CDN Profile name"
  value       = var.environment == "production" ? azurerm_cdn_profile.main[0].name : null
}

# Secrets outputs
output "jwt_secret_key" {
  description = "JWT secret key"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

# Environment configuration summary
output "environment_summary" {
  description = "Summary of environment configuration"
  value = {
    environment             = var.environment
    location               = var.location
    resource_group_name    = azurerm_resource_group.main.name
    postgresql_sku         = azurerm_postgresql_flexible_server.main.sku_name
    redis_sku             = azurerm_redis_cache.main.sku_name
    app_service_plan_sku  = azurerm_service_plan.main.sku_name
    high_availability     = var.environment == "production"
    geo_redundancy        = var.environment == "production"
  }
}

# Connection strings for application configuration
output "application_configuration" {
  description = "Application configuration values"
  value = {
    ConnectionStrings = {
      DefaultConnection = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Database=${azurerm_postgresql_flexible_server_database.main.name};Username=${azurerm_postgresql_flexible_server.main.administrator_login};Password=${random_password.db_admin_password.result};SSL Mode=Require;"
      Redis            = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
    }
    ApplicationInsights = {
      InstrumentationKey = azurerm_application_insights.main.instrumentation_key
      ConnectionString   = azurerm_application_insights.main.connection_string
    }
    JWT = {
      SecretKey = random_password.jwt_secret.result
    }
    Storage = {
      ConnectionString = azurerm_storage_account.main.primary_connection_string
      ContainerName   = azurerm_storage_container.uploads.name
    }
    KeyVault = {
      VaultUri = azurerm_key_vault.main.vault_uri
    }
  }
  sensitive = true
}
