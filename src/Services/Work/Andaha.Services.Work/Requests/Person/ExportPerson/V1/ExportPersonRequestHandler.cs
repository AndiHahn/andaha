using Andaha.Services.Work.Requests.Person.ExportPerson.Services;
using ClosedXML.Excel;
using MediatR;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.V1;

internal class ExportPersonRequestHandler : IRequestHandler<ExportPersonRequest, IResult>
{
    private const string ExportFileContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private const string ExportFileFormat = "xlsx";

    private readonly IEnumerable<IExportService> exportServices;

    public ExportPersonRequestHandler(IEnumerable<IExportService> exportServices)
    {
        this.exportServices = exportServices ?? throw new ArgumentNullException(nameof(exportServices));
    }

    public async Task<IResult> Handle(ExportPersonRequest request, CancellationToken cancellationToken)
    {
        using var workBook = new XLWorkbook();

        foreach (var exportService in exportServices)
        {
            await exportService.WriteWorkSheetAsync(workBook, cancellationToken);
        }

        byte[] workbookBytes;
        using (var memoryStream = new MemoryStream())
        {
            workBook.SaveAs(memoryStream);
            workbookBytes = memoryStream.ToArray();
        }

        var excelStream = new MemoryStream(workbookBytes);

        var info = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
        DateTimeOffset localServerTime = DateTimeOffset.Now;
        DateTimeOffset localCETTime = TimeZoneInfo.ConvertTime(localServerTime, info);

        return Results.File(
            excelStream,
            ExportFileContentType,
            $"Export_Personen_Arbeitszeiten_{localCETTime.ToString("yyyyMMdd")}.{ExportFileFormat}");
    }
}
