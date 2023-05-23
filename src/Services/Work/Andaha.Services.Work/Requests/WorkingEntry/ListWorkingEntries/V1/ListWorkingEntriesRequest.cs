using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Work.Requests.WorkingEntry.ListWorkingEntries.V1;

public record ListWorkingEntriesRequest(Guid PersonId) : IHttpRequest;
