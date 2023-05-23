using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.WorkingEntry.UpdateWorkingEntry.V1;

public record UpdateWorkingEntryRequest(
    Guid Id,
    [property: FromBody] UpdateWorkingEntryDto WorkingEntry) : IHttpRequest;
