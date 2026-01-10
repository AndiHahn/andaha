using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class AnalyzeBillProcessingState : Entity<Guid>
{
    public DateTimeOffset? LastProcessedUtc { get; set; }
}
