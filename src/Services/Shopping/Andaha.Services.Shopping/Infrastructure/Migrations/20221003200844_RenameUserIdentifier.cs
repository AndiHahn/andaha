using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    public partial class RenameUserIdentifier : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedByUserId",
                table: "Bill",
                newName: "UserId");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "BillCategory",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "BillCategory");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Bill",
                newName: "CreatedByUserId");
        }
    }
}
