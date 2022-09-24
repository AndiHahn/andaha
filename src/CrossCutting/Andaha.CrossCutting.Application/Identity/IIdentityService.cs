namespace Andaha.CrossCutting.Application.Identity;
public interface IIdentityService
{
    Guid GetUserId();

    string GetUserEmailAddress();
}
