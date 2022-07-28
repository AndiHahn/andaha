param stage string
param location string

var sqlServerAdminLogin = 'andaha-sql-admin'
var sqlServerAdminLoginPassword = 'Pass@word'
var identityDbName = 'andaha-identitydb-${stage}'

resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: 'andaha-sqlserver-identity-${stage}'
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

  resource identityDb 'databases@2021-05-01-preview' = {
    name: identityDbName
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

var identityDbConnectionString = 'Server=tcp:${sqlServer.name}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${identityDbName};Persist Security Info=False;User ID=${sqlServerAdminLogin};Password=${sqlServerAdminLoginPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

output connectionString string = identityDbConnectionString