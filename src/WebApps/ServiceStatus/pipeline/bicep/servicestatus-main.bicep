param stage string = 'dev'
param version string
param location string = resourceGroup().location
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module containerApp 'servicestatus-app-module.bicep' = {
  name: 'andaha-webapps-servicestatus'
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