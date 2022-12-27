param stage string
param location string = resourceGroup().location
param version string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlServerAdminPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
    sqlServerAdminPassword: sqlServerAdminPassword
  }
}

module applicationInsights 'monolith-appinsights-module.bicep' = {
  name: 'andaha-monolith-appinsights'
  params: {
    stage: stage
    location: location
  }
}

module storage '../../../Shopping/pipeline/bicep/shopping-storage-module.bicep' = {
  name: 'andaha-shopping-storage'
  params: {
    stage: stage
    location: location
  }
}

module containerApp 'monolith-app-module.bicep' = {
  name: 'andaha-monolith-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerAppsEnvironmentDomain: coreInfrastructure.outputs.containerAppEnvironmentDomain
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
    storageConnectionString: storage.outputs.storageConnectionString
    applicationInsightsConnectionString: applicationInsights.outputs.connectionString
  }
}
