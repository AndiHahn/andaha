param stage string
param location string

module storage 'miniclient-storage-module.bicep' = {
  name: 'miniclientstorage'
  params: {
    location: location
    stage: stage
  }
}
