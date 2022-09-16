param stage string
param location string = resourceGroup().location
param adminAadUserObjectId string

resource generatePwScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'andaha-sql-password'
  location: location
  kind: 'AzurePowerShell'
  properties: {
    azPowerShellVersion: '3.0' 
    retentionInterval: 'P1D'
    scriptContent: loadTextContent('./scripts/generate-password.ps1')
  }
}

var sqlServerAdminPassword = generatePwScript.properties.outputs.password

module containerAppsEnvironment 'container-app-env-module.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

module keyVault 'keyvault-module.bicep' = {
  name: 'andaha-infrastructure-keyvault'
  params: {
    stage: stage
    location: location
    adminAadUserObjectId: adminAadUserObjectId
    sqlServerAdminPw: sqlServerAdminPassword
  }
}

module sqlServer 'sql-server-module.bicep' = {
  name: 'andaha-infrastructure-sql-server'
  params: {
    stage: stage
    location: location
    sqlServerAdminPw: sqlServerAdminPassword
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
output sqlServerAdminLogin string = sqlServer.outputs.sqlServerAdminLogin
output sqlServerAdminLoginPassword string = sqlServerAdminPassword
