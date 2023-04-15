using FluentValidation;

namespace Andaha.Services.Shopping.Requests.BillCategory.UpdateOrder.V1;

public class UpdateOrderCommandValidator : AbstractValidator<UpdateOrderCommand>
{
    public UpdateOrderCommandValidator()
    {
        this.RuleFor(command => command.Orders)
            .Must(EachOrderAppearsOnce)
            .WithMessage("Each given order must only appear once.");

        this.RuleFor(command => command.Orders)
            .Must(OrdersContainsNoGap)
            .WithMessage("Orders must not have a gap.");
    }

    private static bool EachOrderAppearsOnce(IReadOnlyCollection<CategoryOrderDto> orders)
    {
        var nrOfOrders = orders.Count;

        return orders.DistinctBy(order => order.Order).Count() == nrOfOrders;
    }

    private static bool OrdersContainsNoGap(IReadOnlyCollection<CategoryOrderDto> orders)
    {
        if (!orders.Any())
        {
            return true;
        }

        return orders.MaxBy(order => order.Order)!.Order < orders.Count;
    }
}
