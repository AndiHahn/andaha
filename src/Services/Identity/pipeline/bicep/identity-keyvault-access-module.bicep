param keyVaultName string
param appObjectId string

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName

  resource accessPolicy 'accessPolicies' = {
    name: 'add'
    properties: {
      accessPolicies: [
        {
          objectId: appObjectId
            tenantId: tenant().tenantId
            permissions: {
              secrets: [
                'get'
              ]
              certificates: [
                'get'
              ]
            }
        }
      ]
    }
  }
}
