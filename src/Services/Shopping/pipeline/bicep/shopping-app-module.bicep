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
@secure()
param storageConnectionString string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/services/shopping:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/services/shopping:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'shopping-api-${stage}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'shopping-api'
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
              secretRef: 'shoppingdb-connection-string'
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
              value: 'https://andreasorganization.b2clogin.com'
            }
            {
              name: 'Authentication__AzureAdB2C__ClientId'
              value: authAzureAdB2CClientId
            }
            {
              name: 'Authentication__AzureAdB2C__Domain'
              value: 'andreasorganization.onmicrosoft.com'
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
        appId: 'shopping-api'
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
          name: 'shoppingdb-connection-string'
          value: sqlDbConnectionString
        }
        {
          name: 'storage-connection-string'
          value: storageConnectionString
        }
      ]
    }
  }
}
