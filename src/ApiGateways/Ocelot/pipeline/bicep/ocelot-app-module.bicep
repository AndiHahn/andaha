param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/gateways/ocelot:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/gateways/ocelot:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'ocelot-gateway-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'ocelot-gateway'
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
              name: 'Hosts__OCELOT_DAPR_SIDECAR'
              value: 'http://127.0.0.1:3500'
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
      dapr: {
        enabled: true
        appId: 'ocelot-gateway'
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
