using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostFound.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4OwnershipReturn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClaimAnswers_ClaimQuestions_QuestionId",
                table: "ClaimAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_ClaimAnswers_Claims_ClaimId",
                table: "ClaimAnswers");

            migrationBuilder.DropIndex(
                name: "IX_Claims_ItemId",
                table: "Claims");

            migrationBuilder.DropIndex(
                name: "IX_ClaimQuestions_ItemId",
                table: "ClaimQuestions");

            migrationBuilder.AlterColumn<Guid>(
                name: "ItemId",
                table: "QrTokens",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "QrTokens",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "QrTokens",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "QrTokens",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "QrTokens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<DateTime>(
                name: "ExpiresAtUtc",
                table: "Exchanges",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<Guid>(
                name: "ClaimantId",
                table: "Exchanges",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "CodeIssuedAtUtc",
                table: "Exchanges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodeSalt",
                table: "Exchanges",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ConcurrencyToken",
                table: "Exchanges",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "GenerationCount",
                table: "Exchanges",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ItemId",
                table: "Exchanges",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "LockedUntilUtc",
                table: "Exchanges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Exchanges",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Exchanges",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAtUtc",
                table: "Claims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConcurrencyToken",
                table: "Claims",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAtUtc",
                table: "Claims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ClaimQuestions",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ClaimQuestions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "QuestionSnapshot",
                table: "ClaimAnswers",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Preserve and connect any Phase 1-3 foundation rows before the new restrictive FKs are added.
            migrationBuilder.Sql("""
                UPDATE "QrTokens" q SET "OwnerId" = i."OwnerId" FROM "Items" i WHERE q."ItemId" = i."Id";
                UPDATE "Exchanges" e SET "ItemId" = c."ItemId", "ClaimantId" = c."ClaimantId", "OwnerId" = i."OwnerId", "ConcurrencyToken" = e."Id"
                FROM "Claims" c JOIN "Items" i ON i."Id" = c."ItemId" WHERE e."ClaimId" = c."Id";
                UPDATE "Claims" SET "ConcurrencyToken" = "Id" WHERE "ConcurrencyToken" = '00000000-0000-0000-0000-000000000000';
                UPDATE "ClaimAnswers" a SET "QuestionSnapshot" = q."Prompt" FROM "ClaimQuestions" q WHERE a."QuestionId" = q."Id";
                """);

            migrationBuilder.CreateTable(
                name: "QrScans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QrTokenId = table.Column<Guid>(type: "uuid", nullable: false),
                    CoarseLocation = table.Column<string>(type: "text", nullable: true),
                    ContactRequested = table.Column<bool>(type: "boolean", nullable: false),
                    UserAgentFamily = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QrScans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QrScans_QrTokens_QrTokenId",
                        column: x => x.QrTokenId,
                        principalTable: "QrTokens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QrTokens_OwnerId_IsActive",
                table: "QrTokens",
                columns: new[] { "OwnerId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Exchanges_ClaimantId",
                table: "Exchanges",
                column: "ClaimantId");

            migrationBuilder.CreateIndex(
                name: "IX_Exchanges_ItemId_Status",
                table: "Exchanges",
                columns: new[] { "ItemId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Exchanges_OwnerId",
                table: "Exchanges",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Claims_ItemId_ClaimantId_Status",
                table: "Claims",
                columns: new[] { "ItemId", "ClaimantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ClaimQuestions_ItemId_SortOrder",
                table: "ClaimQuestions",
                columns: new[] { "ItemId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QrScans_QrTokenId_CreatedAtUtc",
                table: "QrScans",
                columns: new[] { "QrTokenId", "CreatedAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_ClaimAnswers_ClaimQuestions_QuestionId",
                table: "ClaimAnswers",
                column: "QuestionId",
                principalTable: "ClaimQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClaimAnswers_Claims_ClaimId",
                table: "ClaimAnswers",
                column: "ClaimId",
                principalTable: "Claims",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Exchanges_AspNetUsers_ClaimantId",
                table: "Exchanges",
                column: "ClaimantId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Exchanges_AspNetUsers_OwnerId",
                table: "Exchanges",
                column: "OwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Exchanges_Items_ItemId",
                table: "Exchanges",
                column: "ItemId",
                principalTable: "Items",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QrTokens_AspNetUsers_OwnerId",
                table: "QrTokens",
                column: "OwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClaimAnswers_ClaimQuestions_QuestionId",
                table: "ClaimAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_ClaimAnswers_Claims_ClaimId",
                table: "ClaimAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_Exchanges_AspNetUsers_ClaimantId",
                table: "Exchanges");

            migrationBuilder.DropForeignKey(
                name: "FK_Exchanges_AspNetUsers_OwnerId",
                table: "Exchanges");

            migrationBuilder.DropForeignKey(
                name: "FK_Exchanges_Items_ItemId",
                table: "Exchanges");

            migrationBuilder.DropForeignKey(
                name: "FK_QrTokens_AspNetUsers_OwnerId",
                table: "QrTokens");

            migrationBuilder.DropTable(
                name: "QrScans");

            migrationBuilder.DropIndex(
                name: "IX_QrTokens_OwnerId_IsActive",
                table: "QrTokens");

            migrationBuilder.DropIndex(
                name: "IX_Exchanges_ClaimantId",
                table: "Exchanges");

            migrationBuilder.DropIndex(
                name: "IX_Exchanges_ItemId_Status",
                table: "Exchanges");

            migrationBuilder.DropIndex(
                name: "IX_Exchanges_OwnerId",
                table: "Exchanges");

            migrationBuilder.DropIndex(
                name: "IX_Claims_ItemId_ClaimantId_Status",
                table: "Claims");

            migrationBuilder.DropIndex(
                name: "IX_ClaimQuestions_ItemId_SortOrder",
                table: "ClaimQuestions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "QrTokens");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "QrTokens");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "QrTokens");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "QrTokens");

            migrationBuilder.DropColumn(
                name: "ClaimantId",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "CodeIssuedAtUtc",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "CodeSalt",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "ConcurrencyToken",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "GenerationCount",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "ItemId",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "LockedUntilUtc",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Exchanges");

            migrationBuilder.DropColumn(
                name: "CompletedAtUtc",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ConcurrencyToken",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ReviewedAtUtc",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ClaimQuestions");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ClaimQuestions");

            migrationBuilder.DropColumn(
                name: "QuestionSnapshot",
                table: "ClaimAnswers");

            migrationBuilder.AlterColumn<Guid>(
                name: "ItemId",
                table: "QrTokens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "ExpiresAtUtc",
                table: "Exchanges",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Claims_ItemId",
                table: "Claims",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ClaimQuestions_ItemId",
                table: "ClaimQuestions",
                column: "ItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_ClaimAnswers_ClaimQuestions_QuestionId",
                table: "ClaimAnswers",
                column: "QuestionId",
                principalTable: "ClaimQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClaimAnswers_Claims_ClaimId",
                table: "ClaimAnswers",
                column: "ClaimId",
                principalTable: "Claims",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
