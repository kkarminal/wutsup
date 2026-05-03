using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Wutsup.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF NOT EXISTS so this migration is idempotent when init.sql
            // has already created the table (e.g. on first Docker Compose startup).
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS logs (
                    id bigint GENERATED ALWAYS AS IDENTITY,
                    timestamp timestamptz NOT NULL DEFAULT NOW(),
                    level varchar(10) NOT NULL,
                    message text NOT NULL,
                    source varchar(255) NOT NULL,
                    correlation_id uuid,
                    created_at timestamptz NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_logs" PRIMARY KEY (id)
                );

                CREATE INDEX IF NOT EXISTS idx_logs_correlation_id ON logs (correlation_id);
                CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (level);
                CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp DESC);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "logs");
        }
    }
}
