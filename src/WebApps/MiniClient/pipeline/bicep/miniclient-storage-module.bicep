param stage string
param location string

resource imageStorage 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: 'andahaminiclient${stage}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }

  resource blobService 'blobServices' = {
    name: 'default'
    
    resource test 'containers' = {
      name: '$web'
    }
  }
}
