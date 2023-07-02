using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Work.Requests.WorkingEntry.DeleteWorkingEntry.V1;

public record DeleteWorkingEntryRequest(Guid Id) : IHttpRequest;
