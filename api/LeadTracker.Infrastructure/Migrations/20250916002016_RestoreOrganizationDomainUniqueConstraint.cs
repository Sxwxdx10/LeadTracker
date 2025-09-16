using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LeadTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RestoreOrganizationDomainUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations",
                column: "Domain",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations",
                column: "Domain");
        }
    }
}
