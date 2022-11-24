param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerAppsEnvironmentDomain string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlDbConnectionString string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/services/budgetplan:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/services/budgetplan:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'budgetplan-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'budgetplan-api'
          image: imageName
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://0.0.0.0:80'
            }
            {
              name: 'ConnectionStrings__ApplicationDbConnection'
              secretRef: 'budgetplandb-connection-string'
            }
            {
              name: 'ExternalUrls__IdentityApi'
              value: 'https://identity-api-${stage}.${containerAppsEnvironmentDomain}'
            }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                port: 80
                path: '/hc'
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 2
              successThreshold: 1
              failureThreshold: 3
            }
            {
              type: 'Liveness'
              httpGet: {
                port: 80
                path: '/liveness'
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 2
              successThreshold: 1
              failureThreshold: 3
            }
            {
              type: 'Startup'
              httpGet: {
                port: 80
                path: '/hc'
                scheme: 'HTTP'
              }
              initialDelaySeconds: 0
              periodSeconds: 15
              timeoutSeconds: 3
              successThreshold: 1
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
    configuration: {
      activeRevisionsMode: 'single'
      dapr: {
        enabled: true
        appId: 'budgetplan-api'
        appPort: 80
      }
      registries: [
        {
          server: 'andaha.azurecr.io'
          username: containerRegistryUsername
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: [
        {
          name: 'container-registry-password'
          value: containerRegistryPassword
        }
        {
          name: 'budgetplandb-connection-string'
          value: sqlDbConnectionString
        }
      ]
    }
  }
}
