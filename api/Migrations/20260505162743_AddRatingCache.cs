using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRatingCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "rating_cache",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    discovery_item_id = table.Column<int>(type: "integer", nullable: false),
                    rating_data_json = table.Column<string>(type: "text", nullable: false),
                    cached_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rating_cache", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_rating_cache_discovery_item_id",
                table: "rating_cache",
                column: "discovery_item_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_rating_cache_expires_at",
                table: "rating_cache",
                column: "expires_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "rating_cache");
        }
    }
}
