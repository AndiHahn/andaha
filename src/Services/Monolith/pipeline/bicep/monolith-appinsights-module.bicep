param stage string
param location string

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'monolith-api-insights-${stage}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    DisableIpMasking: false
    DisableLocalAuth: false
    Flow_Type: 'Bluefield'
    ForceCustomerStorageForProfiler: false
    ImmediatePurgeDataOn30Days: true
    IngestionMode: 'ApplicationInsights'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Disabled'
    Request_Source: 'rest'
    SamplingPercentage: 0
  }
}

output connectionString string = applicationInsights.properties.ConnectionString
