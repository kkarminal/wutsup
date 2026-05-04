using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandNavigationSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Fix icons on original seed data (ids 1–17) ──────────────────
            // These were inserted by the first migration with null icons.
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'globe-outline' WHERE id = 1;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'calendar-outline' WHERE id = 2;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'restaurant-outline' WHERE id = 3;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'beer-outline' WHERE id = 4;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'bicycle-outline' WHERE id = 5;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'musical-notes-outline' WHERE id = 6;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'football-outline' WHERE id = 7;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'color-palette-outline' WHERE id = 8;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'restaurant-outline' WHERE id = 9;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'cafe-outline' WHERE id = 10;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'car-outline' WHERE id = 11;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'wine-outline' WHERE id = 12;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'tv-outline' WHERE id = 13;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'pint-outline' WHERE id = 14;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'leaf-outline' WHERE id = 15;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'school-outline' WHERE id = 16;");
            migrationBuilder.Sql("UPDATE navigation_nodes SET icon = 'game-controller-outline' WHERE id = 17;");

            // ── Level 1: Add more top-level categories ──────────────────────
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 18, "Nightlife",  "moon-outline", 1, 4 },
                    { 19, "Shopping",   "bag-outline", 1, 5 },
                    { 20, "Wellness",   "heart-outline", 1, 6 },
                });

            // ── Level 2: Expand existing categories with more children ──────

            // Events (id=2) — add more event types
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 21, "Comedy",     "happy-outline", 2, 3 },
                    { 22, "Festivals",  "bonfire-outline", 2, 4 },
                    { 23, "Networking", "people-outline", 2, 5 },
                });

            // Food (id=3) — add more food types
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 24, "Bakeries",    "nutrition-outline", 3, 3 },
                    { 25, "Fine Dining", "diamond-outline", 3, 4 },
                    { 26, "Street Food", "fast-food-outline", 3, 5 },
                });

            // Bars (id=4) — add more bar types
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 27, "Wine Bars",   "wine-outline", 4, 3 },
                    { 28, "Dive Bars",   "boat-outline", 4, 4 },
                    { 29, "Rooftop",     "sunny-outline", 4, 5 },
                });

            // Activities (id=5) — add more
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 30, "Gaming",    "game-controller-outline", 5, 3 },
                    { 31, "Workshops", "hammer-outline", 5, 4 },
                });

            // Nightlife (id=18)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 32, "Clubs",       "disc-outline", 18, 0 },
                    { 33, "Live Music",  "mic-outline", 18, 1 },
                    { 34, "Karaoke",     "mic-outline", 18, 2 },
                    { 35, "Late Night",  "moon-outline", 18, 3 },
                    { 36, "Dance",       "body-outline", 18, 4 },
                });

            // Shopping (id=19)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 37, "Boutiques",   "shirt-outline", 19, 0 },
                    { 38, "Markets",     "storefront-outline", 19, 1 },
                    { 39, "Vintage",     "time-outline", 19, 2 },
                    { 40, "Malls",       "business-outline", 19, 3 },
                    { 41, "Bookstores",  "book-outline", 19, 4 },
                });

            // Wellness (id=20)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 42, "Yoga",        "body-outline", 20, 0 },
                    { 43, "Spas",        "water-outline", 20, 1 },
                    { 44, "Gyms",        "barbell-outline", 20, 2 },
                    { 45, "Meditation",  "flower-outline", 20, 3 },
                });

            // ── Level 3: Deep subcategories ─────────────────────────────────

            // Music (id=6) → genres
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 46, "Rock",        "flash-outline", 6, 0 },
                    { 47, "Jazz",        "musical-note-outline", 6, 1 },
                    { 48, "Electronic",  "pulse-outline", 6, 2 },
                    { 49, "Hip Hop",     "headset-outline", 6, 3 },
                    { 50, "Classical",   "musical-notes-outline", 6, 4 },
                });

            // Restaurants (id=9) → cuisine types
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 51, "Italian",     "pizza-outline", 9, 0 },
                    { 52, "Mexican",     "flame-outline", 9, 1 },
                    { 53, "Japanese",    "fish-outline", 9, 2 },
                    { 54, "Indian",      "flame-outline", 9, 3 },
                    { 55, "Thai",        "leaf-outline", 9, 4 },
                    { 56, "American",    "star-outline", 9, 5 },
                });

            // Outdoor (id=15) → activity types
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 57, "Hiking",      "walk-outline", 15, 0 },
                    { 58, "Cycling",     "bicycle-outline", 15, 1 },
                    { 59, "Kayaking",    "boat-outline", 15, 2 },
                    { 60, "Parks",       "leaf-outline", 15, 3 },
                    { 61, "Beaches",     "sunny-outline", 15, 4 },
                });

            // Clubs (id=32) → club types (level 4!)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 62, "Techno",      "pulse-outline", 32, 0 },
                    { 63, "House",       "home-outline", 32, 1 },
                    { 64, "Latin",       "flame-outline", 32, 2 },
                    { 65, "R&B",         "heart-outline", 32, 3 },
                });

            // Cocktail Bars (id=12) → styles
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 66, "Speakeasy",   "key-outline", 12, 0 },
                    { 67, "Tiki",        "umbrella-outline", 12, 1 },
                    { 68, "Classic",     "wine-outline", 12, 2 },
                    { 69, "Modern",      "flask-outline", 12, 3 },
                });

            // Reset the identity sequence so future inserts get ids > 69
            migrationBuilder.Sql(
                "SELECT setval('navigation_nodes_id_seq', 69, true);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove all nodes added by this migration (ids 18–69)
            for (int id = 69; id >= 18; id--)
            {
                migrationBuilder.DeleteData(
                    table: "navigation_nodes",
                    keyColumn: "id",
                    keyValue: id);
            }
        }
    }
}
