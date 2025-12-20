using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;

namespace Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;

public interface IInvoiceAnalysisService
{
    Task<InvoiceAnalysisResult> AnalyzeAsync(Stream invoiceStream, CancellationToken ct = default);
}
