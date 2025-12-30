param stage string
param location string

resource storage 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name: 'andahashopping${stage}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  
  resource blob 'blobServices@2025-06-01' = {
    name: 'default'
    properties: {
      isVersioningEnabled: true
    }

    resource imagesContainer 'containers@2025-06-01' = {
      name: 'images'
      properties: {
        publicAccess: 'None'
      }
    }

    resource analysisContainer 'containers@2025-06-01' = {
      name: 'analysis'
      properties: {
        publicAccess: 'None'
      }
    }
  }
}

output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
