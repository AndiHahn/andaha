using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntries.V1;

public record CreateWorkingEntriesRequest(
    [property: FromBody] CreateWorkingEntriesDto WorkingEntries) : IHttpRequest;
