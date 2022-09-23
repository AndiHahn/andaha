param stage string
param location string

resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: 'andaha-miniclient-${stage}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'Custom'
  }
}

output hostName string = staticWebApp.properties.defaultHostname
output deploymentToken string = listSecrets(staticWebApp.id, staticWebApp.apiVersion).properties.apiKey
