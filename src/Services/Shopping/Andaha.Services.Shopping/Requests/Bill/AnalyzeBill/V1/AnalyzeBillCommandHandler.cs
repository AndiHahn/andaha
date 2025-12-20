using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using MediatR;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

public class AnalyzeBillCommandHandler : IRequestHandler<AnalyzeBillCommand, IResult>
{
    private readonly IInvoiceAnalysisService invoiceAnalysisService;

    public AnalyzeBillCommandHandler(IInvoiceAnalysisService invoiceAnalysisService)
    {
        this.invoiceAnalysisService = invoiceAnalysisService ?? throw new ArgumentNullException(nameof(invoiceAnalysisService));
    }

    public async Task<IResult> Handle(AnalyzeBillCommand request, CancellationToken cancellationToken)
    {
        var test = await invoiceAnalysisService.AnalyzeAsync(request.BillImageStream, cancellationToken);

        return Results.Ok(test);
    }
}
