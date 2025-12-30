using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Contracts;

public record AnalyzeBillMessageV1 : IHttpRequest
{
    public required Guid Id { get; set; }
}
