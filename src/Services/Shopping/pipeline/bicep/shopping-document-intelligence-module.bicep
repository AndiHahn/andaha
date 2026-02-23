param stage string
param location string

var name = 'andaha-docintelligence-${stage}'

resource docIntelligence 'Microsoft.CognitiveServices/accounts@2025-10-01-preview' = {
  name: name
  location: location
  sku: {
    name: 'S0'
  }
  kind: 'FormRecognizer'
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
