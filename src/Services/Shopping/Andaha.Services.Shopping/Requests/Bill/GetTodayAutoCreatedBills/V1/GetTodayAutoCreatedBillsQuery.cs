using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.GetTodayAutoCreatedBills.V1;

/// <param name="Tz">IANA time zone id of the local day; defaults to Europe/Vienna.</param>
public record GetTodayAutoCreatedBillsQuery([FromQuery] string? Tz = null) : IHttpRequest;
