using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Work.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedPaymentInformation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "PayedMoney",
                table: "Person",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PayedTip",
                table: "Person",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayedMoney",
                table: "Person");

            migrationBuilder.DropColumn(
                name: "PayedTip",
                table: "Person");
        }
    }
}
