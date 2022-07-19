using FluentValidation.Results;

namespace Andaha.CrossCutting.Application.Result
{
    public class PagedResult<T> : Result<IEnumerable<T>>, IPagedResult
    {
        public PagedResult(IEnumerable<T> value, int totalCount) : base(value)
        {
            this.TotalCount = totalCount;
        }

        protected PagedResult(ResultStatus status, IList<ValidationFailure> errors)
            : base(status, errors)
        {
        }

        public int TotalCount { get; }

        public Type GetValueType() => typeof(T);

        public static PagedResult<T> Error(IList<ValidationFailure> failures) => new(ResultStatus.BadRequest, failures);
    }
}
