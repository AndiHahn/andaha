param stage string
param location string

var storageAccountName = 'andahaminiclient${stage}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }

  resource blobService 'blobServices' = {
    name: 'default'
    
    resource webContainer 'containers' = {
      name: '$web'
    }
  }
}

param deploymentScriptTimestamp string = utcNow()
var indexDocument = 'index.html'
var errorDocument404Path = 'error.html'

var storageAccountContributorRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '17d1049b-9a84-46fb-8f53-869881c3d3ab')

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: 'DeploymentScript'
  location: location
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2020-04-01-preview' = {
  scope: storageAccount
  name: guid(resourceGroup().id, storageAccountContributorRoleDefinitionId)
  properties: {
    roleDefinitionId: storageAccountContributorRoleDefinitionId
    principalId: managedIdentity.properties.principalId
  }
}

resource deploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'deploymentScript'
  location: location
  kind: 'AzurePowerShell'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  dependsOn: [
    roleAssignment
    storageAccount
  ]
  properties: {
    azPowerShellVersion: '3.0'
    scriptContent: '''
param(
    [string] $ResourceGroupName,
    [string] $StorageAccountName,
    [string] $IndexDocument,
    [string] $ErrorDocument404Path)
$ErrorActionPreference = 'Stop'
$storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -AccountName $StorageAccountName
$ctx = $storageAccount.Context
Enable-AzStorageStaticWebsite -Context $ctx -IndexDocument $IndexDocument -ErrorDocument404Path $ErrorDocument404Path
'''
    forceUpdateTag: deploymentScriptTimestamp
    retentionInterval: 'PT4H'
    arguments: '-ResourceGroupName ${resourceGroup().name} -StorageAccountName ${storageAccountName} -IndexDocument ${indexDocument} -ErrorDocument404Path ${errorDocument404Path}'
  }
}

output storageAccountName string = storageAccountName
