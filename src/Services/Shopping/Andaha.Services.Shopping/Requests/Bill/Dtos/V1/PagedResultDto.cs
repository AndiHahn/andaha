namespace Andaha.Services.Shopping.Requests.Bill.Dtos.V1;

public record PagedResultDto<T>(IReadOnlyCollection<T> Values, int TotalCount);
