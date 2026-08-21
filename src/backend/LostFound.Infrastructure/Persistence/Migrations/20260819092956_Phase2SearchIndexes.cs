using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LostFound.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase2SearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Items_Brand",
                table: "Items",
                column: "Brand");

            migrationBuilder.CreateIndex(
                name: "IX_Items_Color",
                table: "Items",
                column: "Color");

            migrationBuilder.CreateIndex(
                name: "IX_Items_Latitude_Longitude",
                table: "Items",
                columns: new[] { "Latitude", "Longitude" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Items_Brand",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Items_Color",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Items_Latitude_Longitude",
                table: "Items");
        }
    }
}
