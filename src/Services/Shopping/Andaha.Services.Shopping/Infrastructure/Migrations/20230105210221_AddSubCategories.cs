using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SubCategoryId",
                table: "Bill",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BillSubCategory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillSubCategory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillSubCategory_BillCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "BillCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bill_SubCategoryId",
                table: "Bill",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BillSubCategory_CategoryId",
                table: "BillSubCategory",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_BillSubCategory_SubCategoryId",
                table: "Bill",
                column: "SubCategoryId",
                principalTable: "BillSubCategory",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_BillSubCategory_SubCategoryId",
                table: "Bill");

            migrationBuilder.DropTable(
                name: "BillSubCategory");

            migrationBuilder.DropIndex(
                name: "IX_Bill_SubCategoryId",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "SubCategoryId",
                table: "Bill");
        }
    }
}
