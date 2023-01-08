using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillImage : Entity<Guid>
{
    public BillImage(Guid billId, string name, byte[] thumbnail)
        : base(Guid.NewGuid())
    {
        BillId = billId;
        Name = name;
        Thumbnail = thumbnail;
    }

    public Guid BillId { get; private set; }

    public string Name { get; private set; }

    public byte[] Thumbnail { get; private set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Bill Bill { get; private set; } = null!;
}
