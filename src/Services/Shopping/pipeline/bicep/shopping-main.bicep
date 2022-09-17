param stage string
param location string = resourceGroup().location
param version string
param adminAadUserObjectId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
    adminAadUserObjectId: adminAadUserObjectId
  }
}

module sqlDatabase 'shopping-db-module.bicep' = {
  name: 'andaha-shopping-sql'
  params: {
    stage: stage
    location: location
    sqlServerAdminLogin: coreInfrastructure.outputs.sqlServerAdminLogin
    sqlServerAdminLoginPassword: coreInfrastructure.outputs.sqlServerAdminLoginPassword
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
