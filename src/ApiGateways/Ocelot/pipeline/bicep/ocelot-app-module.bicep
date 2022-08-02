param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerAppsEnvironmentDomain string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'ocelot-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'ocelot-api'
          image: 'andaha.azurecr.io/andaha/gateways/ocelot:${imageVersion}'
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
              name: 'Hosts__SHOPPING_API_HOST'
              value: 'https://shopping-api-${stage}.${containerAppsEnvironmentDomain}:80'
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
        maxReplicas: 3
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
      ]
    }
  }
}
