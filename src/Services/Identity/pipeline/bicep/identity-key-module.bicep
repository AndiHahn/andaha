param stage string
param appObjectId string

var config = json(loadTextContent('../../../../../pipeline/bicep/config.json'))

var keyVaultName = config['key-vault-name']

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: '${keyVaultName}-${stage}'

  resource accessPolicy 'accessPolicies@2022-07-01' = {
    name: 'add'
    properties: {
      accessPolicies: [
        {
          objectId: appObjectId
          tenantId: tenant().tenantId
          permissions: {
            certificates: [
              'get'
            ]
          }
        }
      ]
    }
  }
}
