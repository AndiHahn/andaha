# Dapr auf Azure Container Apps Deployment

## Übersicht

Dieses Bicep-Setup deployt:
- **Azure Service Bus** mit Topic für Dapr Pub/Sub
- **Dapr Component** registriert in der Container App Environment
- **Container App Environment** mit Dapr-Support

## Deployment-Schritte

### 1. Resourcen-Gruppe erstellen (einmalig)
```powershell
az group create `
  --name andaha-rg-prod `
  --location westeurope
```

### 2. Infrastructure deployen
```powershell
az deployment group create `
  --resource-group andaha-rg-prod `
  --template-file main.bicep `
  --parameters `
    stage=prod `
    sqlServerAdminPassword='<your-secure-password>' `
  --output table
```

### 3. Service Bus Connection String abrufen
Der String wird als Output zurückgegeben und ist bereits im Dapr Component konfiguriert.

## Wichtige Punkte für deine Container Apps

### Dapr aktivieren in deinen Container App Definitions

In deinen Container App Deployments (über Bicep oder Azure CLI) musst du folgende Properties setzen:

```bicep
daprConfig: {
  enabled: true
  appId: 'andaha-services-identity'  // pro Service unterschiedlich
  appPort: 5000  // Port deiner .NET App
  protocol: 'http'
  httpReadBufferSize: 4096
  logLevel: 'info'
}
```

### Service-zu-Service Kommunikation via Dapr

**Publish (z.B. aus Identity Service):**
```csharp
var metadata = new Dictionary<string, string> { };
await daprClient.PublishEventAsync("pubsub", "orderCreated", orderEvent);
```

**Subscribe (z.B. in Shopping Service):**
```csharp
app.MapPost("/dapr/subscribe", () => new[] 
{
    new { pubsubname = "pubsub", topic = "orderCreated" }
});

app.MapPost("/orders/create", async (Order order) =>
{
    // Event empfangen
});
```

## Dapr Component Scopes

Das Dapr Component ist konfiguriert für folgende Apps:
- andaha-gateways-ocelot
- andaha-services-identity
- andaha-services-shopping
- andaha-services-collaboration
- andaha-services-budgetplan
- andaha-services-monolith

## Troubleshooting

### Service Bus Connection wird nicht gefunden
```powershell
az servicebus namespace list --resource-group andaha-rg-prod
az servicebus namespace authorization-rule keys list `
  --resource-group andaha-rg-prod `
  --namespace-name <namespace> `
  --name RootManageSharedAccessKey
```

### Dapr Component Status prüfen
```powershell
az containerapp env dapr-component list `
  --name andaha-containerapp-env-prod `
  --resource-group andaha-rg-prod
```

### Logs analysieren
```powershell
az containerapp logs show `
  --name andaha-services-identity `
  --resource-group andaha-rg-prod `
  --container-name andaha-services-identity \
  --follow
```

## Lokale Entwicklung vs. Azure

| Aspekt | Local (docker-compose) | Azure |
|--------|------------------------|-------|
| Pub/Sub | Redis | Azure Service Bus |
| Dapr | Edge Container | Managed Runtime |
| Config | YAML Dateien | Bicep/ARM Templates |
| Secrets | Environment Vars | Key Vault |

## Kosten-Optimierung

- **Service Bus Standard**: ~5€/Monat Min. + Messaging
- **Log Analytics**: ~50GB Free Tier
- Container Apps: Pay-per-use (sehr günstig)

## Nächste Schritte

1. Container App Definitions mit Dapr-Config aktualisieren
2. Key Vault für Secrets integrieren (optional aber empfohlen)
3. CI/CD Pipeline anpassen für Azure
4. Monitoring Dashboard in Log Analytics erstellen
