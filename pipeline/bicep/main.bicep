param stage string
param location string = resourceGroup().location

module containerAppsEnvironment 'container-app-env-module.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppEnvironmentDomain string = containerAppsEnvironment.outputs.domain
