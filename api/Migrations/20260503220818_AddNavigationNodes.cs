using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationNodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "navigation_nodes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    label = table.Column<string>(type: "varchar(255)", nullable: false),
                    icon = table.Column<string>(type: "varchar(100)", nullable: true),
                    parent_id = table.Column<int>(type: "integer", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_navigation_nodes", x => x.id);
                    table.ForeignKey(
                        name: "fk_navigation_nodes_parent_id",
                        column: x => x.parent_id,
                        principalTable: "navigation_nodes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_navigation_nodes_parent_id",
                table: "navigation_nodes",
                column: "parent_id");

            // Seed data — inserted in parent-first order to satisfy FK constraints.
            // Level 0: root
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[] { 1, "What's Up", "globe-outline", null, 0 });

            // Level 1: children of root (id=1)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 2, "Events",     "calendar-outline", 1, 0 },
                    { 3, "Food",       "restaurant-outline", 1, 1 },
                    { 4, "Bars",       "beer-outline", 1, 2 },
                    { 5, "Activities", "bicycle-outline", 1, 3 }
                });

            // Level 2: children of Events (id=2)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 6, "Music",  "musical-notes-outline", 2, 0 },
                    { 7, "Sports", "football-outline", 2, 1 },
                    { 8, "Arts",   "color-palette-outline", 2, 2 }
                });

            // Level 2: children of Food (id=3)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 9,  "Restaurants", "restaurant-outline", 3, 0 },
                    { 10, "Cafes",       "cafe-outline", 3, 1 },
                    { 11, "Food Trucks", "car-outline", 3, 2 }
                });

            // Level 2: children of Bars (id=4)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 12, "Cocktail Bars", "wine-outline", 4, 0 },
                    { 13, "Sports Bars",   "tv-outline", 4, 1 },
                    { 14, "Breweries",     "pint-outline", 4, 2 }
                });

            // Level 2: children of Activities (id=5)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 15, "Outdoor",       "leaf-outline", 5, 0 },
                    { 16, "Classes",       "school-outline", 5, 1 },
                    { 17, "Entertainment", "game-controller-outline", 5, 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "navigation_nodes");
        }
    }
}
