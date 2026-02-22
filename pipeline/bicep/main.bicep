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

module serviceBus 'servicebus-module.bicep' = {
  name: 'andaha-infrastructure-servicebus'
  params: {
    location: location
    stage: stage
  }
}

module daprComponent 'dapr-component-module.bicep' = {
  name: 'andaha-infrastructure-dapr-component'
  params: {
    stage: stage
    containerAppEnvironmentId: containerAppsEnvironment.outputs.id
    serviceBusConnectionString: serviceBus.outputs.connectionString
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
output databaseConnectionString string = database.outputs.connectionString
output logAnalyticsWorkspaceId string = containerAppsEnvironment.outputs.logWorkspaceId
output serviceBusNamespace string = serviceBus.outputs.serviceBusNamespace
output serviceBusEndpoint string = serviceBus.outputs.serviceBusEndpoint
