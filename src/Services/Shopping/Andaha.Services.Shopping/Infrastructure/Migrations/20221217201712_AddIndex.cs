using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_BillCategory_Name",
                table: "BillCategory",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Bill_Date",
                table: "Bill",
                column: "Date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BillCategory_Name",
                table: "BillCategory");

            migrationBuilder.DropIndex(
                name: "IX_Bill_Date",
                table: "Bill");
        }
    }
}
