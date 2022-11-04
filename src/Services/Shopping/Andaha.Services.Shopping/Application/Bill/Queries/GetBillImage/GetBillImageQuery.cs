using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Models;
using MediatR;

namespace Andaha.Services.Shopping.Application.Bill.Queries.GetBillImage;

public record GetBillImageQuery(Guid BillId) : IRequest<Result<BillImageModel>>;
