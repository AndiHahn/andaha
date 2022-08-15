param stage string = 'dev'
param location string = resourceGroup().location
param version string
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

module sqlDatabase 'shopping-db-module.bicep' = {
  name: 'andaha-shopping-sql'
  params: {
    location: location
    stage: stage
  }
}

module containerApp 'shopping-app-module.bicep' = {
  name: 'andaha-shopping-service'
  params: {
    stage: stage
    location: location
    imageVersion: version
    containerAppsEnvironmentId: coreInfrastructure.outputs.containerAppEnvironmentId
    containerAppsEnvironmentDomain: coreInfrastructure.outputs.containerAppEnvironmentDomain
    containerRegistryUsername: containerRegistryUsername
    containerRegistryPassword: containerRegistryPassword
    sqlDbConnectionString: sqlDatabase.outputs.connectionString
  }
}
