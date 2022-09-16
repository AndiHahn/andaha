param stage string
param location string
param adminAadUserObjectId string
@secure()
param sqlServerAdminPw string

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
        objectId: adminAadUserObjectId
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

  resource sqlSecret 'secrets@2022-07-01' = {
    name: 'sql-admin-pw'
    properties: {
      attributes: {
        enabled: true
      }
      value: sqlServerAdminPw
    }
  }
}
