param stage string = 'dev'
param version string
param location string = resourceGroup().location
param containerRegistryUsername string
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/deploy/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module sqlDatabase 'identity-db-module.bicep' = {
  name: 'andaha-identity-sql'
  params: {
    location: location
    stage: stage
  }
}

module containerApp 'identity-app-module.bicep' = {
  name: 'andaha-identity-service'
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
