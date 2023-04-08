namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public readonly record struct BillCategoryDto(Guid Id, string Name, string Color, int Order);
