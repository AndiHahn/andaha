namespace Andaha.CrossCutting.Application.Result
{
    public class PagedResult<T> : Result<IEnumerable<T>>, IPagedResult
    {
        public PagedResult(IEnumerable<T> value, int totalCount) : base(value)
        {
            this.TotalCount = totalCount;
        }

        public int TotalCount { get; }

        public Type GetValueType() => typeof(T);
    }
}
