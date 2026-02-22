param containerAppEnvironmentId string
param serviceBusConnectionString string

resource daprComponent 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  name: '${last(split(containerAppEnvironmentId, '/'))}/pubsub'
  properties: {
    componentType: 'pubsub.azure.servicebus'
    version: 'v1'
    metadata: [
      {
        name: 'connectionString'
        value: serviceBusConnectionString
      }
      {
        name: 'consumerID'
        value: '{appId}'
      }
      {
        name: 'maxConcurrentHandlers'
        value: '1'
      }
    ]
    scopes: [
      'andaha-gateways-ocelot'
      'andaha-services-identity'
      'andaha-services-shopping'
      'andaha-services-collaboration'
      'andaha-services-budgetplan'
      'andaha-services-monolith'
    ]
  }
}

output daprComponentName string = daprComponent.name
