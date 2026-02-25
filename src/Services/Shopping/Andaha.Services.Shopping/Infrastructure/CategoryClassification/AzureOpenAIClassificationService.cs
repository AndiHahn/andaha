using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification;

internal class AzureOpenAIClassificationService(
    IOptions<AzureOpenAiConfiguration> options,
    ILogger<AzureOpenAIClassificationService> logger) : ICategoryClassificationService
{
    private readonly AzureOpenAIClient openAIClient = new(
        new Uri(options.Value.Endpoint),
        new AzureKeyCredential(options.Value.ApiKey));
    private readonly string deploymentName = options.Value.DeploymentName;
    private readonly ILogger<AzureOpenAIClassificationService> logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<CategoryClassificationResult> ClassifyAsync(
        string? vendorName,
        string[] lineItemDescriptions,
        BillCategory[] availableCategories,
        CancellationToken ct = default)
    {
        try
        {
            var systemPrompt = GetSystemPrompt(availableCategories);
            var userMessage = BuildUserMessage(vendorName, lineItemDescriptions);

            var chatCompletionOptions = new ChatCompletionOptions
            {
                Temperature = 1,
            };

            var chatClient = openAIClient.GetChatClient(deploymentName);

            var response = await chatClient.CompleteChatAsync(
                [
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(userMessage)
                ],
                chatCompletionOptions,
                cancellationToken: ct);
            
            var content = response.Value.Content;

            return ParseClassificationResult(content);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during category classification for vendor {VendorName}", vendorName);
            throw;
        }
    }

    private static string GetSystemPrompt(BillCategory[] availableCategories)
    {
        var categories = string.Join(
            ", ",
            availableCategories.Select(
                c => $"Category: {c.Name} ({c.Id}) with SubCategories: [ {string.Join(
                    ", ",
                    c.SubCategories.Select(subCategory => $"{subCategory.Name} ({subCategory.Id})"))} ];"));

        return $@"Du bist ein Experte für die Kategorisierung von Ausgaben. Deine Aufgabe ist es, eine Rechnung basierend auf dem Verkäufernamen und den Beschreibungen der Rechnungspositionen in eine der folgenden Kategorien einzuordnen:

Verfügbare Kategorien: {categories}

Für manche Kategorien gibt es auch Unterkategorien. Diese stehen in eckiger Klammer hinter der jeweiligen Kategorie.
Eine Unterkategorie soll ebenfalls ermittelt werden, sofern dies Anhand der Rechnung und der verfügbaren Unterkategorien möglich ist.

Antworte immer mit einem JSON-Object in folgender Form:
{{
    ""categoryId"": ""<KategorieId>"",
    ""categoryConfidence"": 0.95,
    ""subCategoryId"": ""<UnterkategorieId>"" (optional),
    ""subCategoryConfidence"": 0.90 (optional),
    ""reasoning"": ""<kurze Erklärung der Klassifizierung>""
}}

Beachte folgende Regeln:
- Die categoryId muss der Id einer der verfügbaren Kategorien entsprechen (diese befindet sich in Klammern hinter dem Kategorienamen)
- Die categoryConfidence muss zwischen 0 und 1 liegen
- Die categoryConfidence soll sich auf die categorie beziehen, nicht auf die Unterkategorie
- Die subCategoryId muss der Id einer der verfügbaren Unterkategorien der gewählten Kategorie entsprechen
- Die subCategoryConfidence muss zwischen 0 und 1 liegen
- Die subCategoryConfidence soll sich auf die subCategorie beziehen
- Wenn die Zuordnung nicht eindeutig ist, nutze eine niedrigere confidence";
    }

    private static string BuildUserMessage(string? vendorName, string[] lineItemDescriptions)
    {
        var message = $"Klassifiziere folgende Ausgabe:\n";
        message += $"Verkäufer: {vendorName}";

        foreach (var lineItemDescription in lineItemDescriptions)
        {
            message += $"\nRechnungszeile: {lineItemDescription}";
        }

        return message;
    }

    private CategoryClassificationResult ParseClassificationResult(ChatMessageContent content)
    {
        try
        {
            var entry = content.FirstOrDefault();

            logger.LogInformation("Classification Result: {Entry}", entry?.Text);

            using var jsonDoc = JsonDocument.Parse(entry.Text);
            var root = jsonDoc.RootElement;

            return new CategoryClassificationResult
            {
                CategoryId = root.GetProperty("categoryId").GetGuid(),
                CategoryConfidence = root.GetProperty("categoryConfidence").GetDouble(),
                SubCategoryId = root.TryGetProperty("subCategoryId", out var subCategoryId) ? subCategoryId.GetGuid() : null,
                SubCategoryConfidence = root.TryGetProperty("subCategoryConfidence", out var subCategoryConfidence) ? subCategoryConfidence.GetDouble() : null,
                Reasoning = root.TryGetProperty("reasoning", out var reasoning) ? reasoning.GetString() : null
            };
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException("Failed to parse OpenAI classification response.", ex);
        }
    }
}
