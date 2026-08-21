using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostFound.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase6DurableMatchingJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchingJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LockedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EngineVersion = table.Column<string>(type: "text", nullable: false),
                    LastErrorCode = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyToken = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchingJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchingJobs_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MatchingJobs_ItemId",
                table: "MatchingJobs",
                column: "ItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchingJobs_Status_NextAttemptAtUtc_LockedAtUtc",
                table: "MatchingJobs",
                columns: new[] { "Status", "NextAttemptAtUtc", "LockedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchingJobs");
        }
    }
}
