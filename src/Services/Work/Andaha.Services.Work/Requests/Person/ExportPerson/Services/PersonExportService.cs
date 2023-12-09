using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Work.Common;
using Andaha.Services.Work.Infrastructure;
using Andaha.Services.Work.Infrastructure.Proxies;
using Andaha.Services.Work.Requests.Person.ExportPerson.Services;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.Definitions;

internal class PersonExportService : IExportService
{
    private readonly WorkDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public PersonExportService(
        WorkDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task WriteWorkSheetAsync(XLWorkbook workBook, CancellationToken cancellationToken)
    {
        var exportData = await GetExportDataAsync(cancellationToken);

        WriteWorksheet(exportData, workBook);
    }

    private static void WriteWorksheet(
        IReadOnlyCollection<PersonExportRow> data,
        XLWorkbook workBook)
    {
        var worksheet = workBook.Worksheets.Add("Personen");

        // Write headline
        worksheet.Cell("A1").Value = "Personen inkl. Arbeitszeit und Zahlungen";
        worksheet.Cell("A2").Value = $"{data.Count} Personen";

        worksheet.Cell("A1").Style.Font.FontSize = 20;
        worksheet.Cell("A2").Style.Font.FontSize = 10;
        
        // Write content
        CommonExportService.WriteHeader(
            worksheet,
            4,
            new string[] { "Name", "Stundensatz [€]", "Arbeitszeit Gesamt [h]", "Bezahlt [€]", "Trinkgeld [€]", "Offene Zahlung [€]" });

        worksheet.Cell("A5").InsertData(data);

        worksheet.Columns("B:F").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        worksheet.Columns().AdjustToContents(startRow: 4, minWidth: 10, 71);
    }

    private async Task<IReadOnlyCollection<PersonExportRow>> GetExportDataAsync(CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();
        var connectedUsers = await collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var persons = await dbContext.Person
            .AsNoTracking()
            .Where(person =>
                person.UserId == userId ||
                connectedUsers.Contains(person.UserId))
            .OrderByDescending(person => person.WorkingEntries.Sum(entry => entry.WorkDurationTicks))
            .Select(person => new PersonExportRow
            {
                Name = person.Name,
                HourlyRate = person.HourlyRate,
                TotalWorkingTime = new TimeSpan(person.WorkingEntries.Sum(entry => entry.WorkDurationTicks)).ToFormattedString(),
                TotalPayed = person.Payments.Sum(payment => payment.PayedMoney),
                PayedTip = person.Payments.Sum(payment => payment.PayedTip),
                OpenPayment = Math.Round((new TimeSpan(person.WorkingEntries.Sum(entry => entry.WorkDurationTicks)) - new TimeSpan(person.Payments.Sum(payment => payment.PayedHoursTicks))).TotalHours * person.HourlyRate, 2, MidpointRounding.AwayFromZero)
            })
            .ToListAsync(cancellationToken);

        return persons;
    }
}
