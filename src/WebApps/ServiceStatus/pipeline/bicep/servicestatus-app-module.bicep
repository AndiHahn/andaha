param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerAppsEnvironmentDomain string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/webapps/servicestatus:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/webapps/servicestatus:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'servicestatus-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'servicestatus'
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
              name: 'HealthChecksUI__HealthChecks__0__Name'
              value: 'Identity Service'
            }
            {
              name: 'HealthChecksUI__HealthChecks__0__Uri'
              value: 'https://identity-api-${stage}.${containerAppsEnvironmentDomain}/hc'
            }
            {
              name: 'HealthChecksUI__HealthChecks__1__Name'
              value: 'Shopping Service'
            }
            {
              name: 'HealthChecksUI__HealthChecks__1__Uri'
              value: 'https://shopping-api-${stage}.${containerAppsEnvironmentDomain}/hc'
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
      activeRevisionsMode: 'Multiple'
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
