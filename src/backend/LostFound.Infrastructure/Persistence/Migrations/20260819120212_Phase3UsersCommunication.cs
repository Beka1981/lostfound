using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostFound.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase3UsersCommunication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_ConversationId",
                table: "Messages");

            migrationBuilder.AddColumn<string>(
                name: "DirectKey",
                table: "Conversations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowContactSharing",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EmailNotificationsEnabled",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "InAppNotificationsEnabled",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoKey",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponsiblePerson",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId_CreatedAtUtc",
                table: "Messages",
                columns: new[] { "ConversationId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_DirectKey",
                table: "Conversations",
                column: "DirectKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_ConversationId_CreatedAtUtc",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_DirectKey",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "DirectKey",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "AllowContactSharing",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "EmailNotificationsEnabled",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "InAppNotificationsEnabled",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProfilePhotoKey",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ResponsiblePerson",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId",
                table: "Messages",
                column: "ConversationId");
        }
    }
}
