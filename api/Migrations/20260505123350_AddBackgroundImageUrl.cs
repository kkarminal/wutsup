using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBackgroundImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "background_image_url",
                table: "navigation_nodes",
                type: "varchar(1000)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "background_image_url",
                table: "navigation_nodes");
        }
    }
}
