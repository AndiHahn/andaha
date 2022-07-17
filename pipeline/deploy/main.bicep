param stage string = 'dev'
param location string = resourceGroup().location

module containerAppsEnvironment 'infrastructure/container-app-env.bicep' = {
  name: 'andaha-infrastructure-container-app-env'
  params: {
    location: location
    stage: stage
  }
}

output containerAppEnvironmentId string = containerAppsEnvironment.outputs.id
