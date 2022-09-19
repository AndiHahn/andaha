param stage string
param version string
param location string = resourceGroup().location
param adminAadUserObjectId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param facebookAppSecret string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
  }
}

resource generateSqlPwScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'andaha-identity-sql-password'
  location: location
  kind: 'AzurePowerShell'
  properties: {
    azPowerShellVersion: '3.0' 
    retentionInterval: 'P1D'
    scriptContent: loadTextContent('../../../../../pipeline/bicep/scripts/generate-password.ps1')
  }
}

var sqlServerAdminPassword = generateSqlPwScript.properties.outputs.password


module sqlDatabase 'identity-db-module.bicep' = {
  name: 'andaha-identity-sql'
  params: {
    stage: stage
    location: location
    sqlServerAdminLoginPassword: sqlServerAdminPassword
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
    miniClientUrl: 'https://andahaminiclient${stage}.z6.web.core.windows.net'
    keyVaultUri: keyVault.outputs.keyVaultUri
    certificateKeyvaultKey: 'identityserver-certificate'
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: sqlDatabase.outputs.connectionString
    facebookAppSecret: facebookAppSecret
  }
}

module keyVaultAccess 'identity-keyvault-access-module.bicep' = {
  name: 'andaha-keyvault-access'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    appObjectId: containerApp.outputs.appObjectId
  }
}
