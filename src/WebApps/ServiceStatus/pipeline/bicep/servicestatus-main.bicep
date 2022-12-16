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
