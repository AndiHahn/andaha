param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param authAzureAdB2CClientId string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlDbConnectionString string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/services/work:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/services/work:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'work-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'work-api'
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
              secretRef: 'workdb-connection-string'
            }
            {
              name: 'ConnectionStrings__BlobStorageConnectionString'
              secretRef: 'storage-connection-string'
            }
            {
              name: 'Dapr__CollaborationAppId'
              value: 'monolith-api'
            }
            {
              name: 'Authentication__AzureAdB2C__Instance'
              value: 'https://login.andaha.work'
            }
            {
              name: 'Authentication__AzureAdB2C__ClientId'
              value: authAzureAdB2CClientId
            }
            {
              name: 'Authentication__AzureAdB2C__Domain'
              value: 'login.andaha.work'
            }
            {
              name: 'Authentication__AzureAdB2C__TenantId'
              value: '3e43c7d4-5672-4b6f-b26d-0c65646378d8'
            }
            {
              name: 'Authentication__AzureAdB2C__SignUpSignInPolicyId'
              value: 'B2C_1_SignUpSignIn'
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
        appId: 'work-api'
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
          name: 'workdb-connection-string'
          value: sqlDbConnectionString
        }
      ]
    }
  }
}
