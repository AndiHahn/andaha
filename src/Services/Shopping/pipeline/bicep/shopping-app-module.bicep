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

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'shopping-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'shopping-api'
          image: 'andaha.azurecr.io/andaha/services/shopping:${imageVersion}'
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
              secretRef: 'shoppingdb-connection-string'
            }
            {
              name: 'ExternalUrls__IdentityApi'
              value: 'https://identity-api-${stage}.${containerAppsEnvironmentDomain}'
            }
          ]
          probes: [
            {
              httpGet: {
                port: 80
                path: '/hc'
              }
              type: 'Readiness'
            }
            {
              httpGet: {
                port: 80
                path: '/liveness'
              }
              type: 'Liveness'
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
        appId: 'shopping-api'
        appPort: 80
      }
      ingress: {
        external: true
        targetPort: 80
        allowInsecure: true
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
          name: 'shoppingdb-connection-string'
          value: sqlDbConnectionString
        }
      ]
    }
  }
}
