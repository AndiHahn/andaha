namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

/// <summary>
/// A bill the analysis created automatically (<c>fromAutoAnalysis</c>).
/// </summary>
public record AutoCreatedBillDto(
    Guid BillId,
    string? SourceUploadId,
    string ShopName,
    double Price,
    DateTime Date,
    DateTime CreatedAt);
