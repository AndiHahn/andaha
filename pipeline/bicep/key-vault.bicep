param stage string
param location string

var config = json(loadTextContent('config.json'))

var keyVaultName = config['key-vault-name']

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: '${keyVaultName}-${stage}'
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
    ]
  }
}

output keyVaultUri string = keyVault.properties.vaultUri
