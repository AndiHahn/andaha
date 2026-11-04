using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBillTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillTemplate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ShopName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillTemplate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillTemplate_BillCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "BillCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BillTemplate_BillSubCategory_SubCategoryId",
                        column: x => x.SubCategoryId,
                        principalTable: "BillSubCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HiddenBillSuggestion",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShopName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HiddenBillSuggestion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HiddenBillSuggestion_BillCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "BillCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HiddenBillSuggestion_BillSubCategory_SubCategoryId",
                        column: x => x.SubCategoryId,
                        principalTable: "BillSubCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillTemplate_CategoryId",
                table: "BillTemplate",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BillTemplate_SubCategoryId",
                table: "BillTemplate",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BillTemplate_UserId_SortOrder",
                table: "BillTemplate",
                columns: new[] { "UserId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_HiddenBillSuggestion_CategoryId",
                table: "HiddenBillSuggestion",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_HiddenBillSuggestion_SubCategoryId",
                table: "HiddenBillSuggestion",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_HiddenBillSuggestion_UserId",
                table: "HiddenBillSuggestion",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillTemplate");

            migrationBuilder.DropTable(
                name: "HiddenBillSuggestion");
        }
    }
}
