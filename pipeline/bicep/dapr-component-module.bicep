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
        name: 'maxConcurrentHandlers'
        value: '1'
      }
    ]
    scopes: [
      'ocelot-gateway'
      'identity-api'
      'shopping-api'
      'collaboration-api'
      'budgetplan-api'
      'monolith-api'
    ]
  }
}

output daprComponentName string = daprComponent.name
