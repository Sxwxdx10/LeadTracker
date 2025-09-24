using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LeadTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchAndFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Leads_Email",
                table: "Leads",
                newName: "IX_Leads_Email_Search");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Leads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SavedSearchFilters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SearchCriteriaJson = table.Column<string>(type: "text", nullable: false),
                    IsShared = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedSearchFilters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedSearchFilters_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SavedSearchFilters_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Company_Search",
                table: "Leads",
                column: "Company");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_FirstName_Search",
                table: "Leads",
                column: "FirstName");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_LastName_Search",
                table: "Leads",
                column: "LastName");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_OrganizationId_CreatedAt_IsActive",
                table: "Leads",
                columns: new[] { "OrganizationId", "CreatedAt", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_OrganizationId_IsActive",
                table: "Leads",
                columns: new[] { "OrganizationId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_OrganizationId_Source",
                table: "Leads",
                columns: new[] { "OrganizationId", "Source" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_OrganizationId_Status",
                table: "Leads",
                columns: new[] { "OrganizationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Title_Search",
                table: "Leads",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_SavedSearchFilters_CreatedByUserId",
                table: "SavedSearchFilters",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedSearchFilters_LastUsedAt",
                table: "SavedSearchFilters",
                column: "LastUsedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SavedSearchFilters_OrganizationId",
                table: "SavedSearchFilters",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedSearchFilters_OrganizationId_CreatedByUserId",
                table: "SavedSearchFilters",
                columns: new[] { "OrganizationId", "CreatedByUserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SavedSearchFilters");

            migrationBuilder.DropIndex(
                name: "IX_Leads_Company_Search",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_FirstName_Search",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_LastName_Search",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_OrganizationId_CreatedAt_IsActive",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_OrganizationId_IsActive",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_OrganizationId_Source",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_OrganizationId_Status",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_Title_Search",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Leads");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_Email_Search",
                table: "Leads",
                newName: "IX_Leads_Email");
        }
    }
}
