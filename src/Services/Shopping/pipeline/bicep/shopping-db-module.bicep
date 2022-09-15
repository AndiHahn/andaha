param stage string
param location string
param sqlServerAdminLogin string
@secure()
param sqlServerAdminLoginPassword string

var shoppingDbName = 'andaha-shoppingdb-${stage}'

resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' existing = {
  name: 'andaha-sqlserver-${stage}'
  
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

output connectionString string = shoppingDbConnectionString
