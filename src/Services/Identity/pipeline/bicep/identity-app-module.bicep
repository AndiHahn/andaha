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

var environmentDevConfig = [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Development'
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
    name: 'ExternalUrls__ShoppingApi'
    value: 'https://shopping-api.${containerAppsEnvironmentDomain}'
  }
]

var environmentProdConfig = [
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
    name: 'ExternalUrls__ShoppingApi'
    value: 'https://shopping-api.${containerAppsEnvironmentDomain}'
  }
]

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'identity-api'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'identity-api'
          image: 'andaha.azurecr.io/andaha/services/identity:${imageVersion}'
          env: stage == 'dev' ? environmentDevConfig : environmentProdConfig
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
          name: 'identitydb-connection-string'
          value: sqlDbConnectionString
        }
      ]
    }
  }
}
