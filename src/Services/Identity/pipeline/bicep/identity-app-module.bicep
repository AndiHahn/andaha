param stage string
param location string
param imageVersion string
param containerAppsEnvironmentId string
param containerAppsEnvironmentDomain string
param miniClientUrl string
param keyVaultUri string
param certificateKeyvaultKey string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string
@secure()
param sqlDbConnectionString string
@secure()
param facebookAppSecret string
@secure()
param googleClientSecret string

var imageName = stage == 'dev' ? 'andaha.azurecr.io/andaha/services/identity:${imageVersion}' : 'andaha.azurecr.io/prod/andaha/services/identity:${imageVersion}'

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'identity-api-${stage}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'identity-api'
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
            {
              name: 'Certificate__KeyVaultUri'
              value: keyVaultUri
            }
            {
              name: 'Certificate__CertificateName'
              value: certificateKeyvaultKey
            }
            {
              name: 'Authentication__Facebook__AppId'
              value: '459631839436681'
            }
            {
              name: 'Authentication__Facebook__AppSecret'
              value: facebookAppSecret
            }
            {
              name: 'Authentication__Google__ClientId'
              value: '315088715111-shs10j9f3mndrvrq4bkfn5rrslops7n9.apps.googleusercontent.com'
            }
            {
              name: 'Authentication__Google__ClientSecret'
              value: googleClientSecret
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
        maxReplicas: 1
      }
    }
    configuration: {
      activeRevisionsMode: 'single'
      dapr: {
        enabled: true
        appId: 'identity-api'
        appPort: 80
      }
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

output appObjectId string = containerApp.identity.principalId
