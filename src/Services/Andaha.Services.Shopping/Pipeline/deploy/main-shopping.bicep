param stage string = 'dev'
param location string = resourceGroup().location
param version string = 'v1.0.1'
param containerRegistryUsername string
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/deploy/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module shoppingService 'service.bicep' = {
  name: 'andaha-shopping-service'
  params: {
    location: location
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    imageVersion: version
    stage: stage
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
  }
}
