param stage string
param version string
param location string = resourceGroup().location
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlServerAdminPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
    sqlServerAdminPassword: sqlServerAdminPassword
  }
}

module containerApp 'ocelot-app-module.bicep' = {
  name: 'andaha-ocelot-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
  }
}
