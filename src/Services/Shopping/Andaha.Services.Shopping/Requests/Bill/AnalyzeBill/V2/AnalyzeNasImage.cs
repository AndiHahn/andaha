using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V2;

public class AnalyzeNasImage : IHttpRequest
{
    public IFormFile BillImage { get; }

    public AnalyzeNasImage(IFormFile billImage)
    {
        BillImage = billImage;
    }
}
