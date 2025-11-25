using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LeadTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IncreaseTimeZoneLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Organizations_OrganizationId",
                table: "UserInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Users_AcceptedUserId",
                table: "UserInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Users_InvitedByUserId",
                table: "UserInvitations");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "UserInvitations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserInvitations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "User",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "UserInvitations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_Email",
                table: "UserInvitations",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_ExpiresAt",
                table: "UserInvitations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_InvitationToken",
                table: "UserInvitations",
                column: "InvitationToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitations_OrganizationId_Email_IsAccepted",
                table: "UserInvitations",
                columns: new[] { "OrganizationId", "Email", "IsAccepted" });

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Organizations_OrganizationId",
                table: "UserInvitations",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Users_AcceptedUserId",
                table: "UserInvitations",
                column: "AcceptedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Users_InvitedByUserId",
                table: "UserInvitations",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Organizations_OrganizationId",
                table: "UserInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Users_AcceptedUserId",
                table: "UserInvitations");

            migrationBuilder.DropForeignKey(
                name: "FK_UserInvitations_Users_InvitedByUserId",
                table: "UserInvitations");

            migrationBuilder.DropIndex(
                name: "IX_UserInvitations_Email",
                table: "UserInvitations");

            migrationBuilder.DropIndex(
                name: "IX_UserInvitations_ExpiresAt",
                table: "UserInvitations");

            migrationBuilder.DropIndex(
                name: "IX_UserInvitations_InvitationToken",
                table: "UserInvitations");

            migrationBuilder.DropIndex(
                name: "IX_UserInvitations_OrganizationId_Email_IsAccepted",
                table: "UserInvitations");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "UserInvitations",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserInvitations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "User");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "UserInvitations",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Organizations_OrganizationId",
                table: "UserInvitations",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Users_AcceptedUserId",
                table: "UserInvitations",
                column: "AcceptedUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserInvitations_Users_InvitedByUserId",
                table: "UserInvitations",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
