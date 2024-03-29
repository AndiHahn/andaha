param stage string
param location string = resourceGroup().location
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

module staticWebApp 'miniclient-staticwebapp-module.bicep' = {
  name: 'miniclient-static-webapp'
  params: {
    stage: stage
    location: location
  }
}

output monolithApiBaseUrl string = 'https://monolith-api-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output gatewayBaseUrl string = 'https://ocelot-gateway-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output authIssuerUrl string = 'https://identity-api-${stage}.${coreInfrastructure.outputs.containerAppEnvironmentDomain}'
output webAppDeploymentToken string = staticWebApp.outputs.deploymentToken
