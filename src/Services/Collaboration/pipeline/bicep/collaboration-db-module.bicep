param stage string
param location string
@secure()
param sqlServerAdminLoginPassword string

var sqlServerAdminLogin = 'andaha-sql-admin'

var collaborationDbName = 'andaha-collaborationdb-${stage}'

resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: 'andaha-collaboration-sqlserver-${stage}'
  location: location
  properties: {
    administratorLogin: sqlServerAdminLogin
    administratorLoginPassword: sqlServerAdminLoginPassword
  }

  resource sqlServerFirewall 'firewallRules@2021-05-01-preview' = {
    name: 'AllowAllAzureIps'
    properties: {
      // Allow Azure services and resources to access this server
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }

  resource collaborationDb 'databases@2021-05-01-preview' = {
    name: collaborationDbName
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

var collaborationDbConnectionString = 'Server=tcp:${sqlServer.name}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${collaborationDbName};Persist Security Info=False;User ID=${sqlServerAdminLogin};Password=${sqlServerAdminLoginPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

output connectionString string = collaborationDbConnectionString
