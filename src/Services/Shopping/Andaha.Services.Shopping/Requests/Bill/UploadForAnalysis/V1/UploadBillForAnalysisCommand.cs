using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;

public record UploadBillForAnalysisCommand(IFormFile File) : IHttpRequest;