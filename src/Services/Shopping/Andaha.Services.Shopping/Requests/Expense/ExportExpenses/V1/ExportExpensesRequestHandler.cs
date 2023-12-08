using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using ClosedXML.Excel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Expense.ExportExpenses.V1;

internal class ExportExpensesRequestHandler : IRequestHandler<ExportExpensesRequest, IResult>
{
    private const string ExportFileContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private const string ExportFileFormat = "xlsx";

    private readonly ShoppingDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public ExportExpensesRequestHandler(
        ShoppingDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(ExportExpensesRequest request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        IQueryable<Core.Bill> query = dbContext.Bill
            .AsNoTracking()
            .Where(bill =>
                (bill.UserId == userId ||
                connectedUsers.Contains(bill.UserId)) &&
                bill.Date >= request.StartTimeUtc &&
                bill.Date <= request.EndTimeUtc)
            .OrderBy(b => b.Date)
            .ThenBy(b => b.CreatedAt);

        /*
        if (request.CategoryFilter is not null && request.CategoryFilter.Any())
        {
            query = query.Where(bill => request.CategoryFilter.Contains(bill.Category.Id));
        }
        */

        var bills = await query
            .Select(bill => new ExportRow
            {
                Date = bill.Date,
                ShopName = bill.ShopName,
                Category = bill.Category.Name,
                SubCategory = bill.SubCategory != null ? bill.SubCategory.Name : string.Empty,
                Price = bill.Price,
                ImageAvailable = bill.Images.Any() ? "Ja" : "Nein",
                Notes = bill.Notes
            })
            .ToListAsync(cancellationToken);

        var excelStream = CreateExcelExport(request, bills);

        return Results.File(
            excelStream,
            ExportFileContentType,
            $"Export_Ausgaben_{request.StartTimeUtc.ToString("yyyyMMdd")}-{request.EndTimeUtc.ToString("yyyyMMdd")}.{ExportFileFormat}");
    }

    private static Stream CreateExcelExport(
        ExportExpensesRequest request,
        IList<ExportRow> rows)
    {
        using var workBook = new XLWorkbook();

        WriteWorksheet(
            workBook,
            "Gesamt",
            $"Ausgaben im Zeitraum von {request.StartTimeUtc.ToString("dd.MM.yyyy")} bis {request.EndTimeUtc.ToString("dd.MM.yyyy")}",
            rows);

        var rowsGroupedByCategory = rows.GroupBy(row => row.Category);

        foreach (var rowsByCategory in rowsGroupedByCategory)
        {
            WriteWorksheet(
                workBook,
                rowsByCategory.Key,
                $"Ausgaben für Kategorie {rowsByCategory.Key} im Zeitraum von {request.StartTimeUtc.ToString("dd.MM.yyyy")} bis {request.EndTimeUtc.ToString("dd.MM.yyyy")}",
                rowsByCategory.ToArray());
        }

        byte[] workbookBytes;
        using (var memoryStream = new MemoryStream())
        {
            workBook.SaveAs(memoryStream);
            workbookBytes = memoryStream.ToArray();
        }

        return new MemoryStream(workbookBytes);
    }

    private static void WriteWorksheet(
        XLWorkbook workBook,
        string sheetName,
        string headLine,
        IList<ExportRow> rows)
    {
        var worksheet = workBook.Worksheets.Add(
            sheetName
                .Replace("/", "-")
                .Replace("\\", "-")
                .Replace("?", "-")
                .Replace("*", "-")
                .Replace(":", "-")
                .Replace("[", "-")
                .Replace("]", "-")
                .Take(31)
                .ToString());

        // Write headline
        worksheet.Cell("A1").Value = headLine;
        worksheet.Cell("A2").Value = $"{rows.Count} Ausgaben";

        worksheet.Cell("A1").Style.Font.FontSize = 20;
        worksheet.Cell("A2").Style.Font.FontSize = 10;

        // Write content
        WriteHeader(worksheet, 4);

        worksheet.Cell("A5").InsertData(rows);

        worksheet.Columns().AdjustToContents(startRow: 4);
    }

    private static void WriteHeader(IXLWorksheet worksheet, int row)
    {
        worksheet.Cell($"A{row}").Value = "Datum";
        worksheet.Cell($"B{row}").Value = "Shop";
        worksheet.Cell($"C{row}").Value = "Kategorie";
        worksheet.Cell($"D{row}").Value = "Unterkategorie";
        worksheet.Cell($"E{row}").Value = "Preis";
        worksheet.Cell($"F{row}").Value = "Bild Rechnung vorhanden";
        worksheet.Cell($"G{row}").Value = "Notizen";

        worksheet.Row(row).Style.Font.Bold = true;
        worksheet.Row(row).Style.Fill.SetBackgroundColor(XLColor.LightGray);
        worksheet.Row(row).Style.Border.SetBottomBorder(XLBorderStyleValues.Double);
        worksheet.Row(row).Style.Border.BottomBorderColor = XLColor.Black;
    }
}
