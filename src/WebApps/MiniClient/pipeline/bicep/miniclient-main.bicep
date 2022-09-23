param stage string
param location string = resourceGroup().location

module coreInfrastructure '../../../../../pipeline/bicep/main.bicep' = {
  name: 'andaha-core-infrastructure'
  params: {
    stage: stage
    location: location
  }
}

module storage 'miniclient-storage-module.bicep' = {
  name: 'miniclientstorage'
  params: {
    location: location
    stage: stage
  }
}

module staticWebApp 'miniclient-staticwebapp-module.bicep' = {
  name: 'miniclient-static-webapp'
  params: {
    stage: stage
    location: location
  }
}

output gatewayBaseUrl string = 'https://ocelot-gateway-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output authIssuerUrl string = 'https://identity-api-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output webAppDeploymentToken string = staticWebApp.outputs.deploymentToken
output hostName string = staticWebApp.outputs.hostName
