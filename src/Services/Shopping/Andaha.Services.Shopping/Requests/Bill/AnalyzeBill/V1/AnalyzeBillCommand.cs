using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

public class AnalyzeBillCommand : IHttpRequest
{
    public Stream BillImageStream { get; }

    public AnalyzeBillCommand(Stream billImageStream)
    {
        BillImageStream = billImageStream;
    }
}
