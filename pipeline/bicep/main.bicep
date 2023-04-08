param stage string
param location string = resourceGroup().location
@secure()
param sqlServerAdminPassword string

module containerAppsEnvironment 'container-app-env-module.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

module database 'main-db-module.bicep' = {
  name: 'andaha-infrastructure-database'
  params: {
    location: location
    stage: stage
    sqlServerAdminLoginPassword: sqlServerAdminPassword
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
output databaseConnectionString string = database.outputs.connectionString
output logAnalyticsWorkspaceId string = containerAppsEnvironment.outputs.logWorkspaceId
