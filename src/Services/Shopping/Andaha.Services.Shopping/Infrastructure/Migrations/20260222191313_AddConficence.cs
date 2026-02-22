using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConficence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Confidence",
                table: "Bill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TotalAmountConfidence",
                table: "Bill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Confidence",
                table: "AnalyzedBill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TotalAmountConfidence",
                table: "AnalyzedBill",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Confidence",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "TotalAmountConfidence",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "Confidence",
                table: "AnalyzedBill");

            migrationBuilder.DropColumn(
                name: "TotalAmountConfidence",
                table: "AnalyzedBill");
        }
    }
}
