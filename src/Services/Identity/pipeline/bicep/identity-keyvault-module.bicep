param stage string
param location string

var config = json(loadTextContent('../../../../../pipeline//bicep/config.json'))

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: 'andaha-identity-keyvault-${stage}'
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
output keyVaultName string = keyVault.name
