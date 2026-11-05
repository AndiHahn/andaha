using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SourceUploadIdIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SourceUploadId",
                table: "Bill",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)",
                oldMaxLength: 1024,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SourceUploadId",
                table: "AnalyzedBill",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)",
                oldMaxLength: 1024,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bill_SourceUploadId",
                table: "Bill",
                column: "SourceUploadId");

            migrationBuilder.CreateIndex(
                name: "IX_AnalyzedBill_SourceUploadId",
                table: "AnalyzedBill",
                column: "SourceUploadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bill_SourceUploadId",
                table: "Bill");

            migrationBuilder.DropIndex(
                name: "IX_AnalyzedBill_SourceUploadId",
                table: "AnalyzedBill");

            migrationBuilder.AlterColumn<string>(
                name: "SourceUploadId",
                table: "Bill",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SourceUploadId",
                table: "AnalyzedBill",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);
        }
    }
}
