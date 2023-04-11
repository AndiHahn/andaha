using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;

public record DeleteBillCategoryCommand(Guid Id) : IHttpRequest;
