using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.WorkingEntry.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.WorkingEntry.CreateWorkingEntry.V1;

public record CreateWorkingEntryRequest(
    [property: FromBody] CreateWorkingEntryDto WorkingEntry) : IHttpRequest;
