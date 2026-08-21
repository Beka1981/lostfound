using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostFound.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase5Core : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reports_Status_CreatedAtUtc",
                table: "Reports");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedModeratorId",
                table: "Reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConcurrencyToken",
                table: "Reports",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "InternalNotes",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Severity",
                table: "Reports",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ConcurrencyToken",
                table: "ItemMatches",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "EngineVersion",
                table: "ItemMatches",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NotificationVersion",
                table: "ItemMatches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScoreBreakdownJson",
                table: "ItemMatches",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPermanentlyBlocked",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RestrictionReasonCode",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SuspendedUntilUtc",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ModerationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetType = table.Column<string>(type: "text", nullable: false),
                    TargetId = table.Column<Guid>(type: "uuid", nullable: false),
                    Outcome = table.Column<int>(type: "integer", nullable: false),
                    ReasonCode = table.Column<string>(type: "text", nullable: false),
                    PolicyVersion = table.Column<string>(type: "text", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    InternalNotes = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModerationRecords_AspNetUsers_ActorId",
                        column: x => x.ActorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserBlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockerId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockedId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBlocks", x => x.Id);
                    table.CheckConstraint("CK_UserBlocks_DifferentUsers", "\"BlockerId\" <> \"BlockedId\"");
                    table.ForeignKey(
                        name: "FK_UserBlocks_AspNetUsers_BlockedId",
                        column: x => x.BlockedId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserBlocks_AspNetUsers_BlockerId",
                        column: x => x.BlockerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_AssignedModeratorId",
                table: "Reports",
                column: "AssignedModeratorId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status_Severity_CreatedAtUtc",
                table: "Reports",
                columns: new[] { "Status", "Severity", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ItemMatches_Status_MatchScore_UpdatedAtUtc",
                table: "ItemMatches",
                columns: new[] { "Status", "MatchScore", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationRecords_ActorId",
                table: "ModerationRecords",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationRecords_Outcome_CreatedAtUtc",
                table: "ModerationRecords",
                columns: new[] { "Outcome", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationRecords_TargetType_TargetId_CreatedAtUtc",
                table: "ModerationRecords",
                columns: new[] { "TargetType", "TargetId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_UserBlocks_BlockedId",
                table: "UserBlocks",
                column: "BlockedId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBlocks_BlockerId_BlockedId",
                table: "UserBlocks",
                columns: new[] { "BlockerId", "BlockedId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_AspNetUsers_AssignedModeratorId",
                table: "Reports",
                column: "AssignedModeratorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_AspNetUsers_AssignedModeratorId",
                table: "Reports");

            migrationBuilder.DropTable(
                name: "ModerationRecords");

            migrationBuilder.DropTable(
                name: "UserBlocks");

            migrationBuilder.DropIndex(
                name: "IX_Reports_AssignedModeratorId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_Status_Severity_CreatedAtUtc",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_ItemMatches_Status_MatchScore_UpdatedAtUtc",
                table: "ItemMatches");

            migrationBuilder.DropColumn(
                name: "AssignedModeratorId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ConcurrencyToken",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "InternalNotes",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ConcurrencyToken",
                table: "ItemMatches");

            migrationBuilder.DropColumn(
                name: "EngineVersion",
                table: "ItemMatches");

            migrationBuilder.DropColumn(
                name: "NotificationVersion",
                table: "ItemMatches");

            migrationBuilder.DropColumn(
                name: "ScoreBreakdownJson",
                table: "ItemMatches");

            migrationBuilder.DropColumn(
                name: "IsPermanentlyBlocked",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RestrictionReasonCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "SuspendedUntilUtc",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status_CreatedAtUtc",
                table: "Reports",
                columns: new[] { "Status", "CreatedAtUtc" });
        }
    }
}
