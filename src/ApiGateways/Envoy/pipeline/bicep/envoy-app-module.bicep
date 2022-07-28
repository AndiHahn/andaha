param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'envoy-gateway-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'envoy-gateway'
          image: 'andaha.azurecr.io/andaha/gateways/envoy:${imageVersion}'
          env: []
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
