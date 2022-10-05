namespace Andaha.CrossCutting.Application.Identity;
public class ManualIdentityService : IIdentityService
{
    private string? userEmailAddress;
    private Guid userId = Guid.NewGuid();

    public string GetUserEmailAddress() => this.userEmailAddress ?? throw new InvalidOperationException("Email address not set.");

    public Guid GetUserId() => this.userId;

    public void SetUserId(Guid userId) => this.userId = userId;
}
