using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBillImageReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage");

            migrationBuilder.DropForeignKey(
                name: "FK_BillImage_Bill_BillId",
                table: "BillImage");

            migrationBuilder.AlterColumn<Guid>(
                name: "BillId",
                table: "BillImage",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage",
                column: "AnalyzedBillId",
                principalTable: "AnalyzedBill",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_BillImage_Bill_BillId",
                table: "BillImage",
                column: "BillId",
                principalTable: "Bill",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage");

            migrationBuilder.DropForeignKey(
                name: "FK_BillImage_Bill_BillId",
                table: "BillImage");

            migrationBuilder.AlterColumn<Guid>(
                name: "BillId",
                table: "BillImage",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BillImage_AnalyzedBill_AnalyzedBillId",
                table: "BillImage",
                column: "AnalyzedBillId",
                principalTable: "AnalyzedBill",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BillImage_Bill_BillId",
                table: "BillImage",
                column: "BillId",
                principalTable: "Bill",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
