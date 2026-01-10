using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Contracts;

public record AnalyzeBillMessageV1 : IHttpRequest
{
    public required string ImageName { get; set; }

    public required DateTimeOffset LastModifiedUtc { get; set; }
}
