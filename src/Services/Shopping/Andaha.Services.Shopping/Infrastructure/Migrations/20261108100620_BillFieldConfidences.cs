using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BillFieldConfidences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DateConfidence",
                table: "Bill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ShopNameConfidence",
                table: "Bill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TotalAmountText",
                table: "Bill",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DateConfidence",
                table: "AnalyzedBill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ShopNameConfidence",
                table: "AnalyzedBill",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TotalAmountText",
                table: "AnalyzedBill",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateConfidence",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "ShopNameConfidence",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "TotalAmountText",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "DateConfidence",
                table: "AnalyzedBill");

            migrationBuilder.DropColumn(
                name: "ShopNameConfidence",
                table: "AnalyzedBill");

            migrationBuilder.DropColumn(
                name: "TotalAmountText",
                table: "AnalyzedBill");
        }
    }
}
