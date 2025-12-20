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

module storage 'shopping-storage-module.bicep' = {
  name: 'andaha-shopping-storage'
  params: {
    stage: stage
    location: location
  }
}

module documentIntelligence 'shopping-document-intelligence-module.bicep' = {
  name: 'andaha-shopping-document-intelligence'
  params: {
    stage: stage
    location: location
  }
}

module containerApp 'shopping-app-module.bicep' = {
  name: 'andaha-shopping-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    authAzureAdB2CClientId: authAzureAdB2CClientId
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
    storageConnectionString: storage.outputs.storageConnectionString
    documentIntelligenceEndpoint: documentIntelligence.outputs.endpoint
    documentIntelligenceApiKey: documentIntelligence.outputs.key
  }
}
