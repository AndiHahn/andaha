param stage string
param location string = resourceGroup().location
param version string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
  }
}

resource generateSqlPwScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'andaha-collaboration-sql-password'
  location: location
  kind: 'AzurePowerShell'
  properties: {
    azPowerShellVersion: '3.0' 
    retentionInterval: 'P1D'
    scriptContent: loadTextContent('../../../../../pipeline/bicep/scripts/generate-password.ps1')
  }
}

var sqlServerAdminPassword = generateSqlPwScript.properties.outputs.password

module sqlDatabase 'collaboration-db-module.bicep' = {
  name: 'andaha-collaboration-sql'
  params: {
    stage: stage
    location: location
    sqlServerAdminLoginPassword: sqlServerAdminPassword
  }
}

module containerApp 'collaboration-app-module.bicep' = {
  name: 'andaha-collaboration-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerAppsEnvironmentDomain: coreInfrastructure.outputs.containerAppEnvironmentDomain
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: sqlDatabase.outputs.connectionString
  }
}
