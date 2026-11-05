using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillTemplate.UnhideBillSuggestion.V1;

public record UnhideBillSuggestionCommand(Guid Id) : IHttpRequest;
