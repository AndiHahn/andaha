namespace Andaha.Services.Shopping.Models;

public class BillImageModel : IDisposable
{
    private bool disposed = false;

    public BillImageModel(Stream content, string contentType, DateTime lastModified)
    {
        Content = content;
        ContentType = contentType;
        LastModified = lastModified;
    }

    public Stream Content { get; set; }

    public string ContentType { get; set; }

    public DateTime LastModified { get; set; }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposed)
        {
            return;
        }

        if (disposing)
        {
            Content?.Dispose();
        }

        disposed = true;
    }
}
