using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyzeBillTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AnalyzedBillId",
                table: "BillImage",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FromAutoAnalysis",
                table: "Bill",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AnalyzeBillProcessingState",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LastProcessedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyzeBillProcessingState", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AnalyzedBill",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShopName = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    Price = table.Column<double>(type: "float", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyzedBill", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BillLineItem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: true),
                    UnitPrice = table.Column<double>(type: "float", nullable: true),
                    TotalPrice = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillLineItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillLineItem_Bill_BillId",
                        column: x => x.BillId,
                        principalTable: "Bill",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnalyzedBillLineItem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BillId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: true),
                    UnitPrice = table.Column<double>(type: "float", nullable: true),
                    TotalPrice = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyzedBillLineItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnalyzedBillLineItem_AnalyzedBill_BillId",
                        column: x => x.BillId,
                        principalTable: "AnalyzedBill",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillImage_AnalyzedBillId",
                table: "BillImage",
                column: "AnalyzedBillId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyzedBill_Date",
                table: "AnalyzedBill",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyzedBillLineItem_BillId",
                table: "AnalyzedBillLineItem",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "IX_BillLineItem_BillId",
                table: "BillLineItem",
                column: "BillId");

            migrationBuilder.AddForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage",
                column: "AnalyzedBillId",
                principalTable: "AnalyzedBill",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage");

            migrationBuilder.DropTable(
                name: "AnalyzeBillProcessingState");

            migrationBuilder.DropTable(
                name: "AnalyzedBillLineItem");

            migrationBuilder.DropTable(
                name: "BillLineItem");

            migrationBuilder.DropTable(
                name: "AnalyzedBill");

            migrationBuilder.DropIndex(
                name: "IX_BillImage_AnalyzedBillId",
                table: "BillImage");

            migrationBuilder.DropColumn(
                name: "AnalyzedBillId",
                table: "BillImage");

            migrationBuilder.DropColumn(
                name: "FromAutoAnalysis",
                table: "Bill");
        }
    }
}
