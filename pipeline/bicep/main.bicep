param stage string = 'dev'
param location string = resourceGroup().location

module containerAppsEnvironment 'container-app-env.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

module sqlServer 'sql-server.bicep' = {
  name: 'andaha-infrastructure-sql-server'
  params: {
    location: location
    stage: stage
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
