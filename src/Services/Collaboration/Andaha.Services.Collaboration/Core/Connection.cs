using CSharpFunctionalExtensions;

namespace Andaha.Services.Collaboration.Core;

public class Connection : Entity<Guid>
{
    public Connection(Guid fromUserId, Guid targetUserId)
    {
        FromUserId = fromUserId;
        TargetUserId = targetUserId;
    }

    public Guid FromUserId { get; private set; }

    public Guid TargetUserId { get; private set; }
}
