param stage string
param location string = resourceGroup().location
param version string
param authAzureAdB2CClientId string
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

module containerApp 'budgetplan-app-module.bicep' = {
  name: 'andaha-budgetplan-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    authAzureAdB2CClientId: authAzureAdB2CClientId
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
  }
}
