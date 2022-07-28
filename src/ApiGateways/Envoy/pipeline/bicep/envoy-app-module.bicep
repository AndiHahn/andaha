param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

var environmentDevConfig = [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Development'
  }
  {
    name: 'ASPNETCORE_URLS'
    value: 'http://0.0.0.0:80'
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
]

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'envoy-gateway'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'envoy-gateway'
          image: 'andaha.azurecr.io/andaha/gateways/envoy:${imageVersion}'
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
        maxReplicas: 2
      }
    }
    configuration: {
      activeRevisionsMode: 'single'
      ingress: {
        external: true
        targetPort: 80
        allowInsecure: true
      }
      dapr:{
        enabled: true
        appId: 'envoy-gateway'
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
      ]
    }
  }
}
