using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.BillCategory.Commands.UpdateBillCateogires;

public readonly record struct UpdateBillCategoriesCommand(IReadOnlyCollection<BillCategoryUpdateDto> Categories) : IRequest<Result>;
