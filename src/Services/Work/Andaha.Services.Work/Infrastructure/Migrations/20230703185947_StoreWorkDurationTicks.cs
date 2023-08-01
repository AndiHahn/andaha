using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Work.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class StoreWorkDurationTicks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayedHous",
                table: "Person");

            migrationBuilder.AddColumn<long>(
                name: "WorkDurationTicks",
                table: "WorkingEntry",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PayedHoursTicks",
                table: "Person",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkDurationTicks",
                table: "WorkingEntry");

            migrationBuilder.DropColumn(
                name: "PayedHoursTicks",
                table: "Person");

            migrationBuilder.AddColumn<double>(
                name: "PayedHous",
                table: "Person",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
