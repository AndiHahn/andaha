using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

/// <param name="File">The invoice image (form field <c>file</c>).</param>
/// <param name="Id">
/// Optional client-generated GUID (form field <c>id</c>), kept across retries of the same photo: a retry after a lost
/// 202 names the same image instead of creating a second one (US-0009).
/// </param>
public record UploadBillForAnalysisCommand(
    IFormFile File,
    [FromForm(Name = "id")] string? Id = null) : IHttpRequest;
