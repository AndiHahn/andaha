using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Azure;
using Azure.Storage.Blobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

/// <summary>
/// Integration tests of the production bill image repository against Azurite (US-0012): content type on upload and copy,
/// conditional upload, missing-blob behaviour and the migration of a legacy blob. Skipped when Azurite is not running.
/// The repository hard-codes container "images", blob path "bills/{name}"; every test uses its own unique name prefix
/// and removes the blobs it created.
/// </summary>
public sealed class AzureStorageImageRepositoryTests : IAsyncLifetime
{
    // Well-known Azurite development account (public, documented default; not a secret)
    private const string AzuriteConnectionString = "UseDevelopmentStorage=true";

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46, 0x49, 0x46, 0, 1];

    private readonly BlobServiceClient blobServiceClient = new(AzuriteConnectionString);
    private readonly AzureStorageImageRepository repository;
    private readonly string prefix = "test-" + Guid.NewGuid().ToString("N") + "/";
    private readonly List<string> created = [];

    public AzureStorageImageRepositoryTests()
    {
        repository = new AzureStorageImageRepository(blobServiceClient);
    }

    private BlobContainerClient Container => blobServiceClient.GetBlobContainerClient("images");

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        foreach (string blob in created)
        {
            try
            {
                await Container.DeleteBlobIfExistsAsync("bills/" + blob);
            }
            catch (Exception)
            {
                // Azurite not reachable (skipped tests): nothing to clean up
            }
        }
    }

    private string Name(string suffix)
    {
        string name = prefix + suffix;
        created.Add(name);

        return name;
    }

    private BlobClient Blob(string name) => Container.GetBlobClient("bills/" + name);

    private async Task<byte[]> ReadAsync(string name)
    {
        await using var stream = await repository.GetImageStreamAsync(name);
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);

        return ms.ToArray();
    }

    [AzuriteFact]
    public async Task Upload_stores_nested_blob_with_content_type_and_bytes()
    {
        string name = Name("u/2026/11/x_" + Guid.NewGuid().ToString("D") + "-1.jpg");

        await repository.UploadImageAsync(name, new MemoryStream(Jpeg), "image/jpeg");

        var blob = Blob(name);
        Assert.True(await blob.ExistsAsync());
        Assert.Equal("image/jpeg", (await blob.GetPropertiesAsync()).Value.ContentType);
        Assert.Equal(Jpeg, await ReadAsync(name));
    }

    [AzuriteFact]
    public async Task UploadIfAbsent_writes_only_the_first_time()
    {
        string name = Name("ifabsent/a.jpg");
        byte[] other = [1, 2, 3];

        bool first = await repository.UploadImageIfAbsentAsync(name, new MemoryStream(Jpeg), "image/jpeg");
        bool second = await repository.UploadImageIfAbsentAsync(name, new MemoryStream(other), "image/png");

        Assert.True(first);
        Assert.False(second);
        Assert.Equal(Jpeg, await ReadAsync(name));
        Assert.Equal("image/jpeg", (await Blob(name).GetPropertiesAsync()).Value.ContentType);
    }

    [AzuriteFact]
    public async Task Copy_keeps_bytes_and_content_type_and_leaves_the_source()
    {
        string source = Name("copy/source.jpg");
        string target = Name("copy/2026/11/target.jpg");
        await repository.UploadImageAsync(source, new MemoryStream(Jpeg), "image/jpeg");

        await repository.CopyImageAsync(source, target);

        Assert.Equal(Jpeg, await ReadAsync(target));
        Assert.Equal("image/jpeg", (await Blob(target).GetPropertiesAsync()).Value.ContentType);
        Assert.True(await Blob(source).ExistsAsync());
        Assert.Equal(Jpeg, await ReadAsync(source));
    }

    [AzuriteFact]
    public async Task Copy_overwrites_an_existing_target()
    {
        string source = Name("overwrite/source.png");
        string target = Name("overwrite/target.jpg");
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        await repository.UploadImageAsync(source, new MemoryStream(png), "image/png");
        await repository.UploadImageAsync(target, new MemoryStream(Jpeg), "image/jpeg");

        await repository.CopyImageAsync(source, target);

        Assert.Equal(png, await ReadAsync(target));
        Assert.Equal("image/png", (await Blob(target).GetPropertiesAsync()).Value.ContentType);
    }

    [AzuriteFact]
    public async Task Copy_of_a_missing_source_throws_FileNotFound_and_creates_no_target()
    {
        string source = Name("copymissing/source.jpg");
        string target = Name("copymissing/target.jpg");

        await Assert.ThrowsAsync<FileNotFoundException>(() => repository.CopyImageAsync(source, target));

        Assert.False(await Blob(target).ExistsAsync());
    }

    [AzuriteFact]
    public async Task Delete_of_a_missing_blob_does_not_throw_and_removes_an_existing_one()
    {
        string name = Name("delete/a.jpg");

        await repository.DeleteImageAsync(name);

        await repository.UploadImageAsync(name, new MemoryStream(Jpeg), "image/jpeg");
        await repository.DeleteImageAsync(name);
        Assert.False(await Blob(name).ExistsAsync());
    }

    [AzuriteFact]
    public async Task Get_of_a_missing_blob_throws_a_404_that_the_migrator_treats_as_missing()
    {
        string name = Name("getmissing/a.jpg");

        // The 404 surfaces already when the stream is opened (OpenReadAsync reads the properties); reading is included to be safe.
        var ex = await Assert.ThrowsAsync<RequestFailedException>(async () =>
        {
            await using var stream = await repository.GetImageStreamAsync(name);
            await stream.CopyToAsync(Stream.Null);
        });

        Assert.Equal(404, ex.Status);
        // BillImageMigrator.IsMissing: FileNotFound or DirectoryNotFound or RequestFailedException { Status: 404 }
        Assert.True(ex is RequestFailedException { Status: 404 });
    }

    [AzuriteFact]
    public async Task Migration_moves_a_legacy_blob_to_the_structured_path_with_content_type()
    {
        var owner = Guid.NewGuid();
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        await using (context)
        {
            var category = new Core.BillCategory(owner, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
            context.BillCategory.Add(category);
            var bill = new Core.Bill(null, owner, category.Id, null, "Billa", 5, new DateTime(2026, 10, 30));
            string legacy = $"{bill.Id:D}-1";
            bill.AddImage(legacy, []);
            context.Bill.Add(bill);
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();

            // legacy blob as the old code wrote it: no content type set
            created.Add(legacy);
            await repository.UploadImageAsync(legacy, new MemoryStream(Jpeg), null);
            string target = BillImagePath.ForBill(owner, new DateTime(2026, 10, 30), "Billa", bill.Id, 1, ".jpg");
            created.Add(target);

            var migrator = new BillImageMigrator(context, repository, NullLogger<BillImageMigrator>.Instance);
            int migrated = await migrator.MigrateBatchAsync(50, CancellationToken.None);

            Assert.Equal(1, migrated);
            Assert.True(await Blob(target).ExistsAsync());
            Assert.Equal("image/jpeg", (await Blob(target).GetPropertiesAsync()).Value.ContentType);
            Assert.Equal(Jpeg, await ReadAsync(target));
            Assert.False(await Blob(legacy).ExistsAsync());
            context.ChangeTracker.Clear();
            Assert.Equal([target], await context.BillImage.Select(i => i.Name).ToListAsync());
        }
    }
}
