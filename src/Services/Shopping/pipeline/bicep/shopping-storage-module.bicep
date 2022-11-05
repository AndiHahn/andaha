param stage string
param location string

resource storage 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name: 'andahashopping${stage}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
