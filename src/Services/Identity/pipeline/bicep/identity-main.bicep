param stage string = 'dev'
param version string
param location string = resourceGroup().location
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module sqlDatabase 'identity-db-module.bicep' = {
  name: 'andaha-identity-sql'
  params: {
    location: location
    stage: stage
  }
}

module containerApp 'identity-app-module.bicep' = {
  name: 'andaha-identity-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerAppsEnvironmentDomain: coreInfrastructure.outputs.containerAppEnvironmentDomain
    miniClientUrl: 'https://andahaminiclient${stage}.z6.web.core.windows.net'
    keyVaultUri: coreInfrastructure.outputs.keyVaultUri
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: sqlDatabase.outputs.connectionString
  }
}

module keyVaultAccess 'identity-key-module.bicep' = {
  name: 'andaha-keyvault-access'
  params: {
    appObjectId: containerApp.outputs.appObjectId 
    stage: stage
  }
}
