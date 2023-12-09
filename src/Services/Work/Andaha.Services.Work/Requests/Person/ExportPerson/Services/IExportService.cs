using ClosedXML.Excel;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

internal interface IExportService
{
    Task WriteWorkSheetAsync(XLWorkbook workBook, CancellationToken cancellationToken);
}
