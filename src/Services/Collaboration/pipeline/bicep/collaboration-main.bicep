param stage string
param location string = resourceGroup().location
param version string
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
    sqlDbConnectionString: coreInfrastructure.outputs.databaseConnectionString
  }
}
