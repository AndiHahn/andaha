using CSharpFunctionalExtensions;

namespace Andaha.Services.Collaboration.Core;

public class ConnectionRequest : Entity<Guid>
{
    public ConnectionRequest(Guid fromUserId, string fromUserEmail, Guid targetUserId, string targetUserEmail)
    {
        FromUserId = fromUserId;
        TargetUserId = targetUserId;
        FromUserEmail = fromUserEmail;
        TargetUserEmail = targetUserEmail;
        RequestedAt = DateTime.UtcNow;
    }

    public Guid FromUserId { get; private set; }

    public string FromUserEmail { get; private set; }

    public Guid TargetUserId { get; private set; }

    public string TargetUserEmail { get; private set; }

    public DateTime RequestedAt { get; private set; }

    public DateTime? AcceptedAt { get; private set; }

    public DateTime? DeclinedAt { get; private set; }

    public void Accept()
    {
        this.AcceptedAt = DateTime.UtcNow;
    }

    public void Decline()
    {
        this.DeclinedAt = DateTime.UtcNow;
    }
}
