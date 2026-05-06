using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSportsChildren : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add children to Sports (id=7)
            migrationBuilder.InsertData(
                table: "navigation_nodes",
                columns: new[] { "id", "label", "icon", "parent_id", "sort_order" },
                values: new object[,]
                {
                    { 70, "Baseball",    "baseball-outline", 7, 0 },
                    { 71, "Basketball",  "basketball-outline", 7, 1 },
                    { 72, "Football",    "american-football-outline", 7, 2 },
                    { 73, "Soccer",      "football-outline", 7, 3 },
                    { 74, "Tennis",      "tennisball-outline", 7, 4 },
                    { 75, "Hockey",      "snow-outline", 7, 5 },
                    { 76, "Golf",        "golf-outline", 7, 6 },
                });

            // Reset the identity sequence so future inserts get ids > 76
            migrationBuilder.Sql(
                "SELECT setval('navigation_nodes_id_seq', 76, true);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            for (int id = 76; id >= 70; id--)
            {
                migrationBuilder.DeleteData(
                    table: "navigation_nodes",
                    keyColumn: "id",
                    keyValue: id);
            }
        }
    }
}
