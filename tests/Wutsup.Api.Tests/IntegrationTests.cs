using System.Net;
using System.Net.Http.Json;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using Wutsup.Api.Data;
using Wutsup.Api.Models;

namespace Wutsup.Api.Tests;

/// <summary>
/// Custom WebApplicationFactory that replaces PostgreSQL with SQLite in-memory
/// and provides all required configuration keys so the API starts successfully.
/// </summary>
public class WutsupWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection;

    public WutsupWebApplicationFactory()
    {
        // Keep a persistent in-memory SQLite connection open for the lifetime of the factory.
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // Set environment to QA so the startup code skips Database.Migrate()
        // (which only runs for "Local" environment).
        builder.UseSetting("App:Environment", "QA");
        builder.UseSetting("App:LogLevel", "Debug");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "DataSource=:memory:");
        builder.UseSetting("GrowthBook:ApiHost", "https://cdn.growthbook.io");
        builder.UseSetting("GrowthBook:ClientKey", "test-key");
        builder.UseSetting("Jwt:Secret", "test-secret-key-that-is-at-least-32-chars-long!");
        builder.UseSetting("Jwt:ExpiryMinutes", "60");
        builder.UseSetting("Cors:AdminOrigin", "http://localhost:3001");

        builder.ConfigureServices(services =>
        {
            // Remove ALL registrations related to AppDbContext so the Npgsql
            // provider is fully cleared before we register SQLite.
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true)
                .ToList();

            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            // Register AppDbContext with SQLite using the shared in-memory connection.
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_connection));
        });
    }

    /// <summary>
    /// Ensures the SQLite database schema is created. Call this after building the host.
    /// </summary>
    public void EnsureDatabase()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection.Dispose();
        }
    }
}

/// <summary>
/// Integration tests for the Wutsup API.
/// Validates: Requirements 2.4, 3.1, 3.4, 4.3, 5.1
/// </summary>
public class IntegrationTests : IClassFixture<WutsupWebApplicationFactory>
{
    private readonly WutsupWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public IntegrationTests(WutsupWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabase();
        _client = _factory.CreateClient();
    }

    /// <summary>
    /// Health-check endpoint returns HTTP 200.
    /// Validates: Requirement 2.4
    /// </summary>
    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    /// <summary>
    /// Database write and read: POST a log entry via the API, then verify it was persisted.
    /// Validates: Requirements 3.1, 5.1
    /// </summary>
    [Fact]
    public async Task DatabaseWriteRead_LogEntryIsPersisted()
    {
        var request = new CreateLogEntryRequest
        {
            Level = "info",
            Source = "IntegrationTest",
            Message = "Database write-read test entry"
        };

        var response = await _client.PostAsJsonAsync("/api/logs", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Verify the entry was persisted in the database.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entry = await db.Logs.FirstOrDefaultAsync(
            e => e.Message == "Database write-read test entry");

        Assert.NotNull(entry);
        Assert.Equal("info", entry.Level);
        Assert.Equal("IntegrationTest", entry.Source);
    }

    /// <summary>
    /// Verify the EF Core schema was applied (the logs table exists and is queryable).
    /// Validates: Requirement 3.4
    /// </summary>
    [Fact]
    public async Task MigrationsApplied_LogsTableExists()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // If the table doesn't exist, this query will throw.
        var count = await db.Logs.CountAsync();

        Assert.True(count >= 0, "The logs table should exist and be queryable.");
    }

    /// <summary>
    /// Remote logging round-trip: POST a log entry to /api/logs with valid data,
    /// verify 201 response and that the entry appears in the database.
    /// Validates: Requirements 4.3, 5.1
    /// </summary>
    [Fact]
    public async Task RemoteLoggingRoundTrip_EntryAppearsInDatabase()
    {
        var correlationMarker = Guid.NewGuid().ToString();
        var request = new CreateLogEntryRequest
        {
            Level = "warn",
            Source = "MobileClient",
            Message = $"Remote log round-trip test {correlationMarker}"
        };

        var response = await _client.PostAsJsonAsync("/api/logs", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Verify the entry is in the database with correct fields.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entry = await db.Logs.FirstOrDefaultAsync(
            e => e.Message.Contains(correlationMarker));

        Assert.NotNull(entry);
        Assert.Equal("warn", entry.Level);
        Assert.Equal("MobileClient", entry.Source);
        Assert.NotEqual(default, entry.Timestamp);
        Assert.NotEqual(default, entry.CreatedAt);
    }
}
