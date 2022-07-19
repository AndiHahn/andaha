param location string
param containerAppsEnvironmentId string
param imageVersion string
param stage string
param containerRegistryUsername string
@secure()
param containerRegistryPassword string

var sqlServerAdminLogin = 'andaha-sql-admin'
var sqlServerAdminLoginPassword = 'Pass@word'
var shoppingDbName = 'andaha-shoppingdb-${stage}'

resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: 'andaha-sqlserver-${stage}'
  location: location
  properties: {
    administratorLogin: sqlServerAdminLogin
    administratorLoginPassword: sqlServerAdminLoginPassword
  }

  resource sqlServerFirewall 'firewallRules@2021-05-01-preview' = {
    name: 'AllowAllWindowsAzureIps'
    properties: {
      // Allow Azure services and resources to access this server
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }

  resource shoppingDb 'databases@2021-05-01-preview' = {
    name: shoppingDbName
    location: location
    sku: {
      name: 'Basic'
      tier: 'Basic'
      capacity: 5
    }
    properties: {
      collation: 'SQL_Latin1_General_CP1_CI_AS'
    }
  }
}

var shoppingDbConnectionString = 'Server=tcp:${sqlServer.name}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${shoppingDbName};Persist Security Info=False;User ID=${sqlServerAdminLogin};Password=${sqlServerAdminLoginPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

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
    secretRef: 'shoppingdb-connection-string'
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
    secretRef: 'shoppingdb-connection-string'
  }
]

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'shopping-api'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    template: {
      containers: [
        {
          name: 'shopping-api'
          image: 'andaha.azurecr.io/andaha/services/shopping:${imageVersion}'
          env: stage == 'dev' ? environmentDevConfig : environmentProdConfig
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
          name: 'shoppingdb-connection-string'
          value: shoppingDbConnectionString
        }
      ]
    }
  }
}
