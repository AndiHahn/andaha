param stage string
param location string = resourceGroup().location
param version string
param authAzureAdB2CClientId string
param authAzureAdB2CGraphApiClientId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlServerAdminPassword string
@secure()
param authAzureAdB2CGraphApiClientSecret string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
    sqlServerAdminPassword: sqlServerAdminPassword
  }
}

module containerApp 'collaboration-app-module.bicep' = {
  name: 'andaha-collaboration-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    authAzureAdB2CClientId: authAzureAdB2CClientId
    authAzureAdB2CGraphApiClientId: authAzureAdB2CGraphApiClientId
    authAzureAdB2CGraphApiClientSecret: authAzureAdB2CGraphApiClientSecret
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
  }
}
