
namespace Andaha.CrossCutting.Application.Result
{
    public interface IPagedResult : IResult
    {
        public int TotalCount { get; }

        public Type GetValueType();
    }
}
