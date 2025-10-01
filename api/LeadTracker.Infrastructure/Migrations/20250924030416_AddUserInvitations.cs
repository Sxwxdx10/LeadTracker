using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LeadTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations");

            migrationBuilder.CreateTable(
                name: "UserInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InvitationToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AcceptedUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserInvitations_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserInvitations_Users_AcceptedUserId",
                        column: x => x.AcceptedUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserInvitations_Users_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations",
                column: "Domain");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_AcceptedUserId",
                table: "UserInvitations",
                column: "AcceptedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_InvitedByUserId",
                table: "UserInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_OrganizationId",
                table: "UserInvitations",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserInvitations");

            migrationBuilder.DropIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Domain",
                table: "Organizations",
                column: "Domain",
                unique: true);
        }
    }
}
