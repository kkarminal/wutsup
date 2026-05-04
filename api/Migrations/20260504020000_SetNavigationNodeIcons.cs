using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class SetNavigationNodeIcons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Set icons on ALL navigation nodes (original + expanded seed data).
            // Previous migrations inserted rows with null icons; this fixes them.
            migrationBuilder.Sql(@"
                UPDATE navigation_nodes SET icon = 'globe-outline' WHERE id = 1;
                UPDATE navigation_nodes SET icon = 'calendar-outline' WHERE id = 2;
                UPDATE navigation_nodes SET icon = 'restaurant-outline' WHERE id = 3;
                UPDATE navigation_nodes SET icon = 'beer-outline' WHERE id = 4;
                UPDATE navigation_nodes SET icon = 'bicycle-outline' WHERE id = 5;
                UPDATE navigation_nodes SET icon = 'musical-notes-outline' WHERE id = 6;
                UPDATE navigation_nodes SET icon = 'football-outline' WHERE id = 7;
                UPDATE navigation_nodes SET icon = 'color-palette-outline' WHERE id = 8;
                UPDATE navigation_nodes SET icon = 'restaurant-outline' WHERE id = 9;
                UPDATE navigation_nodes SET icon = 'cafe-outline' WHERE id = 10;
                UPDATE navigation_nodes SET icon = 'car-outline' WHERE id = 11;
                UPDATE navigation_nodes SET icon = 'wine-outline' WHERE id = 12;
                UPDATE navigation_nodes SET icon = 'tv-outline' WHERE id = 13;
                UPDATE navigation_nodes SET icon = 'pint-outline' WHERE id = 14;
                UPDATE navigation_nodes SET icon = 'leaf-outline' WHERE id = 15;
                UPDATE navigation_nodes SET icon = 'school-outline' WHERE id = 16;
                UPDATE navigation_nodes SET icon = 'game-controller-outline' WHERE id = 17;
                UPDATE navigation_nodes SET icon = 'moon-outline' WHERE id = 18;
                UPDATE navigation_nodes SET icon = 'bag-outline' WHERE id = 19;
                UPDATE navigation_nodes SET icon = 'heart-outline' WHERE id = 20;
                UPDATE navigation_nodes SET icon = 'happy-outline' WHERE id = 21;
                UPDATE navigation_nodes SET icon = 'bonfire-outline' WHERE id = 22;
                UPDATE navigation_nodes SET icon = 'people-outline' WHERE id = 23;
                UPDATE navigation_nodes SET icon = 'nutrition-outline' WHERE id = 24;
                UPDATE navigation_nodes SET icon = 'diamond-outline' WHERE id = 25;
                UPDATE navigation_nodes SET icon = 'fast-food-outline' WHERE id = 26;
                UPDATE navigation_nodes SET icon = 'wine-outline' WHERE id = 27;
                UPDATE navigation_nodes SET icon = 'boat-outline' WHERE id = 28;
                UPDATE navigation_nodes SET icon = 'sunny-outline' WHERE id = 29;
                UPDATE navigation_nodes SET icon = 'game-controller-outline' WHERE id = 30;
                UPDATE navigation_nodes SET icon = 'hammer-outline' WHERE id = 31;
                UPDATE navigation_nodes SET icon = 'disc-outline' WHERE id = 32;
                UPDATE navigation_nodes SET icon = 'mic-outline' WHERE id = 33;
                UPDATE navigation_nodes SET icon = 'mic-outline' WHERE id = 34;
                UPDATE navigation_nodes SET icon = 'moon-outline' WHERE id = 35;
                UPDATE navigation_nodes SET icon = 'body-outline' WHERE id = 36;
                UPDATE navigation_nodes SET icon = 'shirt-outline' WHERE id = 37;
                UPDATE navigation_nodes SET icon = 'storefront-outline' WHERE id = 38;
                UPDATE navigation_nodes SET icon = 'time-outline' WHERE id = 39;
                UPDATE navigation_nodes SET icon = 'business-outline' WHERE id = 40;
                UPDATE navigation_nodes SET icon = 'book-outline' WHERE id = 41;
                UPDATE navigation_nodes SET icon = 'body-outline' WHERE id = 42;
                UPDATE navigation_nodes SET icon = 'water-outline' WHERE id = 43;
                UPDATE navigation_nodes SET icon = 'barbell-outline' WHERE id = 44;
                UPDATE navigation_nodes SET icon = 'flower-outline' WHERE id = 45;
                UPDATE navigation_nodes SET icon = 'flash-outline' WHERE id = 46;
                UPDATE navigation_nodes SET icon = 'musical-note-outline' WHERE id = 47;
                UPDATE navigation_nodes SET icon = 'pulse-outline' WHERE id = 48;
                UPDATE navigation_nodes SET icon = 'headset-outline' WHERE id = 49;
                UPDATE navigation_nodes SET icon = 'musical-notes-outline' WHERE id = 50;
                UPDATE navigation_nodes SET icon = 'pizza-outline' WHERE id = 51;
                UPDATE navigation_nodes SET icon = 'flame-outline' WHERE id = 52;
                UPDATE navigation_nodes SET icon = 'fish-outline' WHERE id = 53;
                UPDATE navigation_nodes SET icon = 'flame-outline' WHERE id = 54;
                UPDATE navigation_nodes SET icon = 'leaf-outline' WHERE id = 55;
                UPDATE navigation_nodes SET icon = 'star-outline' WHERE id = 56;
                UPDATE navigation_nodes SET icon = 'walk-outline' WHERE id = 57;
                UPDATE navigation_nodes SET icon = 'bicycle-outline' WHERE id = 58;
                UPDATE navigation_nodes SET icon = 'boat-outline' WHERE id = 59;
                UPDATE navigation_nodes SET icon = 'leaf-outline' WHERE id = 60;
                UPDATE navigation_nodes SET icon = 'sunny-outline' WHERE id = 61;
                UPDATE navigation_nodes SET icon = 'pulse-outline' WHERE id = 62;
                UPDATE navigation_nodes SET icon = 'home-outline' WHERE id = 63;
                UPDATE navigation_nodes SET icon = 'flame-outline' WHERE id = 64;
                UPDATE navigation_nodes SET icon = 'heart-outline' WHERE id = 65;
                UPDATE navigation_nodes SET icon = 'key-outline' WHERE id = 66;
                UPDATE navigation_nodes SET icon = 'umbrella-outline' WHERE id = 67;
                UPDATE navigation_nodes SET icon = 'wine-outline' WHERE id = 68;
                UPDATE navigation_nodes SET icon = 'flask-outline' WHERE id = 69;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = NULL WHERE id BETWEEN 1 AND 69;");
        }
    }
}
