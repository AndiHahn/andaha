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

module applicationInsights 'monolith-appinsights-module.bicep' = {
  name: 'andaha-monolith-appinsights'
  params: {
    stage: stage
    location: location
    logAnalyticsWorkspace: coreInfrastructure.outputs.logAnalyticsWorkspaceId
  }
}

module storage '../../../Shopping/pipeline/bicep/shopping-storage-module.bicep' = {
  name: 'andaha-shopping-storage'
  params: {
    stage: stage
    location: location
  }
}

module documentIntelligence '../../../Shopping/pipeline/bicep/shopping-document-intelligence-module.bicep' = {
  name: 'andaha-monolith-document-intelligence'
  params: {
    stage: stage
    location: location
  }
}

module openAi '../../../Shopping/pipeline/bicep/shopping-openai-module.bicep' = {
  name: 'andaha-monolith-openai'
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
    authAzureAdB2CClientId: authAzureAdB2CClientId
    authAzureAdB2CGraphApiClientId: authAzureAdB2CGraphApiClientId
    authAzureAdB2CGraphApiClientSecret: authAzureAdB2CGraphApiClientSecret
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
    storageConnectionString: storage.outputs.storageConnectionString
    applicationInsightsInstrumentationKey: applicationInsights.outputs.instrumentationKey
    applicationInsightsConnectionString: applicationInsights.outputs.connectionString
    documentIntelligenceEndpoint: documentIntelligence.outputs.endpoint
    documentIntelligenceApiKey: documentIntelligence.outputs.key
    openAiEndpoint: openAi.outputs.endpoint
    openAiApiKey: openAi.outputs.key
  }
}
