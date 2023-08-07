using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Work.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastPayed",
                table: "Person");

            migrationBuilder.DropColumn(
                name: "PayedHoursTicks",
                table: "Person");

            migrationBuilder.DropColumn(
                name: "PayedMoney",
                table: "Person");

            migrationBuilder.DropColumn(
                name: "PayedTip",
                table: "Person");

            migrationBuilder.CreateTable(
                name: "Payment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayedHoursTicks = table.Column<long>(type: "bigint", nullable: false),
                    PayedMoney = table.Column<double>(type: "float", nullable: false),
                    PayedTip = table.Column<double>(type: "float", nullable: false),
                    PayedAt = table.Column<DateTime>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payment_Person_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Person",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payment_PersonId",
                table: "Payment",
                column: "PersonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payment");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPayed",
                table: "Person",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PayedHoursTicks",
                table: "Person",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

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
    }
}
