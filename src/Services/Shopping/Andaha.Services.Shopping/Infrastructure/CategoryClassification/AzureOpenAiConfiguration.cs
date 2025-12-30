namespace Andaha.Services.Shopping.Infrastructure.CategoryClassification;

public class AzureOpenAiConfiguration
{
    public string Endpoint { get; set; } = null!;
    public string ApiKey { get; set; } = null!;
    public string DeploymentName { get; set; } = null!;
}
