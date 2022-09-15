param stage string
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

module keyVault 'identity-keyvault-module.bicep' = {
  name: 'andaha-keyvault'
  params: {
    stage: stage
    location: location
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
    keyVaultUri: keyVault.outputs.keyVaultUri
    certificateKeyvaultKey: 'identityserver-certificate'
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: sqlDatabase.outputs.connectionString
  }
}

module keyVaultAccess 'identity-keyvault-access-module.bicep' = {
  name: 'andaha-keyvault-access'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    appObjectId: containerApp.outputs.appObjectId
  }
}
