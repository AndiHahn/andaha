param stage string = 'dev'
param version string
param location string = resourceGroup().location
param containerRegistryUsername string
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module containerApp 'ocelot-app-module.bicep' = {
  name: 'andaha-ocelot-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerAppsEnvironmentDomain: coreInfrastructure.outputs.containerAppEnvironmentDomain
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
  }
}
