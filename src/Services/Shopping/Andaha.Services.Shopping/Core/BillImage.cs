using CSharpFunctionalExtensions;

namespace Andaha.Services.Shopping.Core;

public class BillImage : Entity<Guid>
{
    public BillImage(Guid? billId, Guid? analyzedBillId, string name, byte[] thumbnail)
        : base(Guid.NewGuid())
    {
        BillId = billId;
        AnalyzedBillId = analyzedBillId;
        Name = name;
        Thumbnail = thumbnail;
    }

    public Guid? BillId { get; private set; }

    public Guid? AnalyzedBillId { get; private set; }

    public string Name { get; private set; }

    public byte[] Thumbnail { get; private set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Bill? Bill { get; private set; }

    public AnalyzedBill? AnalyzedBill { get; private set; }

    public void Rename(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("Name must not be empty.", nameof(newName));
        }

        if (newName.Length > 200)
        {
            throw new ArgumentException("Name must not exceed 200 characters.", nameof(newName));
        }

        Name = newName;
    }
}
