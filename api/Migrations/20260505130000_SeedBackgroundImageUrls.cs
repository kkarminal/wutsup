using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedBackgroundImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Assign initial background image URLs to top-level category nodes.
            migrationBuilder.Sql(
                "UPDATE navigation_nodes SET background_image_url = '/images/neon_concert_background.jpeg' WHERE label = 'Events';");

            migrationBuilder.Sql(
                "UPDATE navigation_nodes SET background_image_url = '/images/neon_nightclub_background.jpeg' WHERE label = 'Nightlife';");

            migrationBuilder.Sql(
                "UPDATE navigation_nodes SET background_image_url = '/images/neon_sports_background.jpeg' WHERE label = 'Activities';");

            migrationBuilder.Sql(
                "UPDATE navigation_nodes SET background_image_url = '/images/neon_dancing_background.jpeg' WHERE label = 'Dance';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Clear background image URLs for the seeded categories.
            migrationBuilder.Sql(
                "UPDATE navigation_nodes SET background_image_url = NULL WHERE label IN ('Events', 'Nightlife', 'Activities', 'Dance');");
        }
    }
}
