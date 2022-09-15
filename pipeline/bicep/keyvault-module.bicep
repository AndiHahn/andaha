param stage string
param location string
@secure()
param sqlServerAdminPw string

var config = json(loadTextContent('config.json'))

var keyVaultName = 'andaha-keyvault-${stage}'

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableSoftDelete: false
    accessPolicies: [
      {
        objectId: config['admin-aad-user-object-id']
        tenantId: tenant().tenantId
        permissions: {
          certificates: [
            'all'
          ]
          keys: [
            'all'
          ]
          secrets: [
            'all'
          ]
          storage: [
            'all'
          ]
        }
      }
      {
        objectId: config['azure-serviceconnection-object-id']
        tenantId: tenant().tenantId
        permissions: {
          secrets: [
            'set'
            'get'
          ]
        }
      }
    ]
  }
}

resource sqlSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: '${keyVaultName}/sql-admin-pw'
  properties: {
    attributes: {
      enabled: true
    }
    value: sqlServerAdminPw
  }
}
