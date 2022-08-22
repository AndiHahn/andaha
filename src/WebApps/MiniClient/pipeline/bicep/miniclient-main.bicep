param stage string = 'dev'
param location string = resourceGroup().location

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    location: location
    stage: stage
  }
}

module storage 'miniclient-storage-module.bicep' = {
  name: 'miniclientstorage'
  params: {
    location: location
    stage: stage
  }
}

output storageAccountName string = storage.outputs.storageAccountName
output gatewayBaseUrl string = 'https://ocelot-gateway-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output authIssuerUrl string = 'https://identity-api-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
