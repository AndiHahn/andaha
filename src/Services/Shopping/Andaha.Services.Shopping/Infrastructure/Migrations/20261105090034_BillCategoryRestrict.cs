using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BillCategoryRestrict : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_BillCategory_CategoryId",
                table: "Bill");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_BillCategory_CategoryId",
                table: "Bill",
                column: "CategoryId",
                principalTable: "BillCategory",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_BillCategory_CategoryId",
                table: "Bill");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_BillCategory_CategoryId",
                table: "Bill",
                column: "CategoryId",
                principalTable: "BillCategory",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
