namespace Andaha.CrossCutting.Application.Database;
public interface IUserDependentEntity
{
    public Guid UserId { get; }
}
