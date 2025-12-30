param stage string
param location string

var name = 'andaha-openai-${stage}'

resource openAi 'Microsoft.CognitiveServices/accounts@2025-10-01-preview' = {
  name: name
  location: location
  sku: {
    name: 'F0'
  }
  kind: 'OpenAI'
  identity: {
    type: 'None'
  }
  properties: {
    customSubDomainName: name
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    allowProjectManagement: false
    publicNetworkAccess: 'Enabled'
  }
}

output endpoint string = docIntelligence.properties.endpoint
@secure()
output key string = docIntelligence.listKeys().key1
