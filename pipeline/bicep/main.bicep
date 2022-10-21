param stage string
param location string = resourceGroup().location

module containerAppsEnvironment 'container-app-env-module.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

resource generateSqlPwScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'andaha-shopping-sql-password'
  location: location
  kind: 'AzurePowerShell'
  properties: {
    azPowerShellVersion: '3.0' 
    retentionInterval: 'P1D'
    scriptContent: loadTextContent('../../pipeline/bicep/scripts/generate-password.ps1')
  }
}

var sqlServerAdminPassword = generateSqlPwScript.properties.outputs.password

module database 'main-db-module.bicep' = {
  name: 'andaha-infrastructure-database'
  params: {
    location: location
    stage: stage
    sqlServerAdminLoginPassword: sqlServerAdminPassword
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
output databaseConnectionString string = database.outputs.connectionString
