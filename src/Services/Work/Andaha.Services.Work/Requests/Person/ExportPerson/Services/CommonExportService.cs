using ClosedXML.Excel;

namespace Andaha.Services.Work.Requests.Person.ExportPerson.Services;

public class CommonExportService
{
    public static void WriteHeader(IXLWorksheet worksheet, int row, params string[] headerNames)
    {
        var alphabet = GetAlphabet();

        int columnIndex = 0;

        foreach (string name in headerNames)
        {
            worksheet.Cell($"{alphabet[columnIndex]}{row}").Value = name;

            columnIndex++;
        }

        worksheet.Row(row).Style.Font.Bold = true;
        worksheet.Row(row).Style.Fill.SetBackgroundColor(XLColor.LightGray);
        worksheet.Row(row).Style.Border.SetBottomBorder(XLBorderStyleValues.Double);
        worksheet.Row(row).Style.Border.BottomBorderColor = XLColor.Black;
    }

    public static IList<char> GetAlphabet()
    {
        var alphabet = new List<char>();

        for (char c = 'A'; c <= 'Z'; c++)
        {
            alphabet.Add(c);
        }

        return alphabet;
    }
}
