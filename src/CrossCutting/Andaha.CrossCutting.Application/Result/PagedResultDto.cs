namespace Andaha.CrossCutting.Application.Result
{
    public class PagedResultDto<T>
    {
        public PagedResultDto(IEnumerable<T> values, int totalCount)
        {
            Values = values;
            TotalCount = totalCount;
        }

        public IEnumerable<T> Values { get; set; }

        public int TotalCount { get; set; }
    }
}
