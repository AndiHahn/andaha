param stage string
param location string
param serviceBusNamespace string = 'andaha-sbns-${stage}'

// Azure Service Bus Namespace
resource serviceBusNamespaceResource 'Microsoft.ServiceBus/namespaces@2021-11-01' = {
  name: serviceBusNamespace
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

resource pubsubTopic 'Microsoft.ServiceBus/namespaces/topics@2021-11-01' = {
  parent: serviceBusNamespaceResource
  name: 'dapr-pubsub'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: false
  }
}

// Access Keys for Dapr
resource rootAccessKey 'Microsoft.ServiceBus/namespaces/AuthorizationRules@2021-11-01' = {
  parent: serviceBusNamespaceResource
  name: 'RootManageSharedAccessKey'
  properties: {
    rights: ['Listen', 'Manage', 'Send']
  }
}

output serviceBusNamespace string = serviceBusNamespace
output serviceBusEndpoint string = '${serviceBusNamespaceResource.name}.servicebus.windows.net'
output connectionString string = listKeys('${serviceBusNamespaceResource.id}/AuthorizationRules/RootManageSharedAccessKey', serviceBusNamespaceResource.apiVersion).primaryConnectionString
