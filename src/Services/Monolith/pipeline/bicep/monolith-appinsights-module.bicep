param stage string
param location string
param logAnalyticsWorkspace string

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'monolith-api-insights-${stage}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace
  }
}

output instrumentationKey string = applicationInsights.properties.InstrumentationKey
output connectionString string = applicationInsights.properties.ConnectionString
