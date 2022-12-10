using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;

public record SearchBillsQuery(int PageSize, int PageIndex, string? Search) : IHttpRequest;
