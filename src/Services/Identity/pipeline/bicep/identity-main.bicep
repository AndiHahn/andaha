param stage string
param version string
param location string = resourceGroup().location
param adminAadUserObjectId string
param miniClientWebAppUrl string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param facebookAppSecret string
@secure()
param googleClientSecret string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
  }
}

module keyVault 'identity-keyvault-module.bicep' = {
  name: 'andaha-keyvault'
  params: {
    stage: stage
    location: location
    adminAadUserObjectId: adminAadUserObjectId
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
    miniClientUrl: miniClientWebAppUrl
    keyVaultUri: keyVault.outputs.keyVaultUri
    certificateKeyvaultKey: 'identityserver-certificate'
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
    facebookAppSecret: facebookAppSecret
    googleClientSecret: googleClientSecret
  }
}

module keyVaultAccess 'identity-keyvault-access-module.bicep' = {
  name: 'andaha-keyvault-access'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    appObjectId: containerApp.outputs.appObjectId
  }
}
