param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerAppsEnvironmentDomain string
param miniClientUrl string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlDbConnectionString string

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'identity-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'identity-api'
          image: 'andaha.azurecr.io/andaha/services/identity:${imageVersion}'
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
              secretRef: 'identitydb-connection-string'
            }
            {
              name: 'IssuerUrl'
              value: 'https://identity-api-${stage}.${containerAppsEnvironmentDomain}'
            }
            {
              name: 'ExternalUrls__ShoppingApi'
              value: 'https://shopping-api-${stage}.${containerAppsEnvironmentDomain}'
            }
            {
              name: 'ExternalUrls__WebMiniClient'
              value: miniClientUrl
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
        maxReplicas: 1
      }
    }
    configuration: {
      activeRevisionsMode: 'single'
      ingress: {
        external: true
        targetPort: 80
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
          name: 'identitydb-connection-string'
          value: sqlDbConnectionString
        }
      ]
    }
  }
}
