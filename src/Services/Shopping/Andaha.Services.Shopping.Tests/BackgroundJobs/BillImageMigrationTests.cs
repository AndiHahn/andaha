using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public sealed class BillImageMigrationTests : IDisposable
{
    private static readonly Guid Owner = Guid.NewGuid();
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46, 0x49, 0x46, 0, 1];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];

    private readonly string folder = Path.Combine(Path.GetTempPath(), "andaha-migration-" + Guid.NewGuid().ToString("N"));
    private readonly FileSystemImageRepository images;
    private readonly ShoppingDbContext context;
    private readonly Microsoft.Data.Sqlite.SqliteConnection connection;

    public BillImageMigrationTests()
    {
        images = new FileSystemImageRepository(folder);
        (context, connection) = TestDb.CreateShopping();
    }

    public void Dispose()
    {
        context.Dispose();
        connection.Dispose();
        if (Directory.Exists(folder))
        {
            Directory.Delete(folder, recursive: true);
        }
    }

    private BillImageMigrator Migrator() => new(context, images, NullLogger<BillImageMigrator>.Instance);

    private async Task<string> SeedBillAsync(byte[]? content, int number = 1)
    {
        var category = new Core.BillCategory(Owner, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);
        var bill = new Core.Bill(null, Owner, category.Id, null, "Billa", 5, new DateTime(2026, 10, 30));
        string legacy = $"{bill.Id:D}-{number}";
        bill.AddImage(legacy, []);
        context.Bill.Add(bill);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        if (content is not null)
        {
            await images.UploadImageAsync(legacy, new MemoryStream(content), null);
        }

        return legacy;
    }

    private async Task<(Guid Id, string Legacy)> SeedScanAsync(byte[] content)
    {
        var scan = new Core.AnalyzedBill(Owner, null, null, "Billa", 5, null, null);
        string legacy = $"{scan.Id:D}-1";
        scan.AddImage(legacy, []);
        context.AnalyzedBill.Add(scan);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        await images.UploadImageAsync(legacy, new MemoryStream(content), null);

        return (scan.Id, legacy);
    }

    private async Task<List<string>> NamesAsync()
    {
        context.ChangeTracker.Clear();

        return await context.BillImage.Select(i => i.Name).ToListAsync();
    }

    private async Task<bool> ExistsAsync(string name)
    {
        try
        {
            await using var s = await images.GetImageStreamAsync(name);

            return true;
        }
        catch (FileNotFoundException)
        {
            return false;
        }
    }

    [Fact]
    public async Task Migrates_legacy_bill_and_scan_images_to_structured_paths()
    {
        string bill1 = await SeedBillAsync(Jpeg);
        string bill2 = await SeedBillAsync(Png, number: 2);
        var (scanId, scanLegacy) = await SeedScanAsync(Jpeg);

        int migrated = await Migrator().MigrateBatchAsync(50, CancellationToken.None);

        Assert.Equal(3, migrated);
        var names = await NamesAsync();
        Assert.All(names, n => Assert.Contains('/', n));
        Assert.Contains(names, n => n.EndsWith("-1.jpg") && n.Contains("/2026/10/2026-10-30_Billa_"));
        Assert.Contains(names, n => n.EndsWith("-2.png"));
        Assert.Contains(names, n => n.Contains("/offen/") && n.EndsWith($"{scanId:D}-1.jpg"));
        foreach (string name in names)
        {
            Assert.True(await ExistsAsync(name));
        }

        Assert.False(await ExistsAsync(bill1));
        Assert.False(await ExistsAsync(bill2));
        Assert.False(await ExistsAsync(scanLegacy));
    }

    [Fact]
    public async Task Second_run_migrates_nothing()
    {
        await SeedBillAsync(Jpeg);
        var migrator = Migrator();
        await migrator.MigrateBatchAsync(50, CancellationToken.None);
        var before = await NamesAsync();

        int migrated = await migrator.MigrateBatchAsync(50, CancellationToken.None);

        Assert.Equal(0, migrated);
        Assert.Equal(before, await NamesAsync());
    }

    [Fact]
    public async Task Missing_blob_is_skipped_and_the_loop_ends()
    {
        string legacy = await SeedBillAsync(content: null);
        await SeedBillAsync(Jpeg);
        var skipped = new HashSet<Guid>();
        var migrator = Migrator();

        int total = 0;
        int rounds = 0;
        while (rounds++ < 10)
        {
            int before = skipped.Count;
            int migrated = await migrator.MigrateBatchAsync(50, skipped, CancellationToken.None);
            total += migrated;
            if (migrated == 0 && skipped.Count == before)
            {
                break;
            }
        }

        Assert.True(rounds < 10);
        Assert.Equal(1, total);
        Assert.Single(skipped);
        Assert.Contains(legacy, await NamesAsync());
    }

    [Fact]
    public async Task Name_changed_in_the_meantime_is_left_unchanged()
    {
        string legacy = await SeedBillAsync(Jpeg);
        var migrator = Migrator();
        migrator.BeforeUpdate = async () =>
        {
            await using var other = TestDb.Open(connection);
            await other.BillImage.ExecuteUpdateAsync(s => s.SetProperty(i => i.Name, "concurrent/name.jpg"));
        };

        int migrated = await migrator.MigrateBatchAsync(50, CancellationToken.None);

        Assert.Equal(0, migrated);
        Assert.Equal(["concurrent/name.jpg"], await NamesAsync());
        Assert.True(await ExistsAsync(legacy));
    }
}
