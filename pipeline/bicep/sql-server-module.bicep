param stage string
param location string
@secure()
param sqlServerAdminPw string

var sqlServerAdminLogin = 'andaha-sql-admin'

resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: 'andaha-sqlserver-${stage}'
  location: location
  properties: {
    administratorLogin: sqlServerAdminLogin
    administratorLoginPassword: sqlServerAdminPw
  }

  resource sqlServerFirewall 'firewallRules@2021-05-01-preview' = {
    name: 'AllowAllAzureIps'
    properties: {
      // Allow Azure services and resources to access this server
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
}

output sqlServerAdminLogin string = sqlServerAdminLogin
