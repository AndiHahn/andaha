using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using System.Text.Json;

namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification;

internal class AzureOpenAIClassificationService : ICategoryClassificationService
{
    private readonly AzureOpenAIClient openAIClient;
    private readonly string deploymentName;
    private readonly ILogger<AzureOpenAIClassificationService> logger;

    public AzureOpenAIClassificationService(
        IOptions<AzureOpenAiConfiguration> options,
        ILogger<AzureOpenAIClassificationService> logger)
    {
        this.openAIClient = new AzureOpenAIClient(
            new Uri(options.Value.Endpoint),
            new AzureKeyCredential(options.Value.ApiKey));

        this.deploymentName = options.Value.DeploymentName;

        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CategoryClassificationResult> ClassifyAsync(
        string vendorName,
        string[] lineItemDescriptions,
        BillCategory[] availableCategories,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(vendorName))
        {
            throw new ArgumentException("Vendor name cannot be null or empty.", nameof(vendorName));
        }

        try
        {
            var systemPrompt = GetSystemPrompt(availableCategories);
            var userMessage = BuildUserMessage(vendorName, lineItemDescriptions);

            var chatCompletionOptions = new ChatCompletionOptions
            {
                Temperature = 0.3f,
                MaxOutputTokenCount = 500
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
        var categories = string.Join(", ", availableCategories.Select(c => $"{c.Name} ({c.Id})"));

        return $@"Du bist ein Experte für die Kategorisierung von Ausgaben. Deine Aufgabe ist es, einen Ausgabe basierend auf dem Verkäufernamen und den Beschreibungen der Rechnunspositionen in eine der folgenden Kategorien einzuordnen:

Verfügbare Kategorien: {categories}

Antworte immer mit einem JSON-Object in folgender Form:
{{
    ""categoryId"": ""<KategorieId>"",
    ""confidence"": 0.95,
    ""reasoning"": ""<kurze Erklärung der Klassifizierung>""
}}

Beachte folgende Regeln:
- Die categoryId muss der Id einer der verfügbaren Kategorien entsprechen (diese befindet sich in Klammern hinter dem Kategorienamen)
- Die confidence muss zwischen 0 und 1 liegen
- Wenn die Zuordnung nicht eindeutig ist, nutze eine niedrigere confidence";
    }

    private static string BuildUserMessage(string vendorName, string[] lineItemDescriptions)
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
            using var jsonDoc = JsonDocument.Parse(content.ToString());
            var root = jsonDoc.RootElement;

            return new CategoryClassificationResult
            {
                CategoryId = root.GetProperty("categoryId").GetGuid(),
                Confidence = root.GetProperty("confidence").GetDouble(),
                Reasoning = root.TryGetProperty("reasoning", out var reasoning) ? reasoning.GetString() : null
            };
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException("Failed to parse OpenAI classification response.", ex);
        }
    }
}
