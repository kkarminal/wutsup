// Feature: admin-portal, Property 3: Login endpoint rejects empty credentials
// Feature: admin-portal, Property 4: Login endpoint returns 401 for invalid credentials without distinguishing information
// Validates: Requirements 4.3, 4.4

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using Wutsup.Api.Data;
using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

/// <summary>
/// Custom Arbitrary that generates empty or whitespace-only strings.
/// </summary>
public class EmptyOrWhitespaceArbitrary
{
    public static Arbitrary<string?> Arbitrary()
    {
        var gen = Gen.OneOf(
            Gen.Constant<string?>(null),
            Gen.Constant<string?>(""),
            Gen.Constant<string?>(" "),
            Gen.Constant<string?>("\t"),
            Gen.Constant<string?>("   ")
        );
        return gen.ToArbitrary();
    }
}

/// <summary>
/// Custom Arbitrary that generates non-empty, non-whitespace strings for credentials.
/// </summary>
public class NonEmptyCredentialArbitrary
{
    private static readonly char[] AlphaChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();

    public static Arbitrary<string> Arbitrary()
    {
        return Gen.ArrayOf(Gen.Elements(AlphaChars))
            .Where(arr => arr.Length > 0)
            .Select(arr => new string(arr))
            .ToArbitrary();
    }
}

/// <summary>
/// WebApplicationFactory for UsersController tests.
/// Uses SQLite in-memory and provides all required configuration.
/// </summary>
public class UsersControllerTestFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection;

    public UsersControllerTestFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
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

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_connection));
        });
    }

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

public class UsersControllerPropertyTests : IDisposable
{
    private readonly UsersControllerTestFactory _factory;
    private readonly HttpClient _client;

    public UsersControllerPropertyTests()
    {
        _factory = new UsersControllerTestFactory();
        _factory.EnsureDatabase();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    /// <summary>
    /// Property 3: Login endpoint rejects empty credentials.
    /// For any login request where username or password is null/empty/whitespace,
    /// the endpoint returns HTTP 400.
    /// Validates: Requirements 4.4
    /// </summary>
    [Fact]
    public async Task Property3_Login_Returns400_ForEmptyUsername()
    {
        // Test with null/empty/whitespace usernames
        var emptyUsernames = new string?[] { null, "", " ", "\t", "   " };
        var validPassword = "ValidPassword123";

        foreach (var username in emptyUsernames)
        {
            var request = new { username, password = validPassword };
            var response = await _client.PostAsJsonAsync("/api/users/login", request);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    [Fact]
    public async Task Property3_Login_Returns400_ForEmptyPassword()
    {
        // Test with null/empty/whitespace passwords
        var validUsername = "test@example.com";
        var emptyPasswords = new string?[] { null, "", " ", "\t", "   " };

        foreach (var password in emptyPasswords)
        {
            var request = new { username = validUsername, password };
            var response = await _client.PostAsJsonAsync("/api/users/login", request);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    /// <summary>
    /// Property 4: Login endpoint returns 401 for invalid credentials without distinguishing information.
    /// For any credential pair where the username does not exist OR the password does not match,
    /// the endpoint returns HTTP 401 and the response body is identical regardless of which condition failed.
    /// Validates: Requirements 4.3
    /// </summary>
    [Fact]
    public async Task Property4_Login_Returns401_ForUnknownUser_AndResponseBodyIsGeneric()
    {
        // Attempt login with a username that doesn't exist
        var request = new { username = "nonexistent@example.com", password = "SomePassword123" };
        var response = await _client.PostAsJsonAsync("/api/users/login", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        // Response must not contain information distinguishing unknown user from wrong password
        Assert.DoesNotContain("not found", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("does not exist", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("username", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Property4_Login_Returns401_ForWrongPassword_AndResponseBodyIsIdentical()
    {
        // Create a user first
        var hasher = new PasswordHasher();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var testUsername = $"prop4test_{Guid.NewGuid():N}@example.com";
        var correctPassword = "CorrectPassword123!";

        db.Users.Add(new User
        {
            Username = testUsername,
            PasswordHash = hasher.Hash(correctPassword),
            Role = "admin",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        // Attempt login with wrong password
        var wrongPasswordRequest = new { username = testUsername, password = "WrongPassword456!" };
        var wrongPasswordResponse = await _client.PostAsJsonAsync("/api/users/login", wrongPasswordRequest);

        // Attempt login with non-existent user
        var unknownUserRequest = new { username = "unknown@example.com", password = "WrongPassword456!" };
        var unknownUserResponse = await _client.PostAsJsonAsync("/api/users/login", unknownUserRequest);

        // Both must return 401
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPasswordResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownUserResponse.StatusCode);

        // Response bodies must be identical (same generic message)
        var wrongPasswordBody = await wrongPasswordResponse.Content.ReadAsStringAsync();
        var unknownUserBody = await unknownUserResponse.Content.ReadAsStringAsync();

        Assert.Equal(wrongPasswordBody, unknownUserBody);
    }

    [Fact]
    public async Task Login_Returns200_WithToken_ForValidCredentials()
    {
        // Create a user
        var hasher = new PasswordHasher();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var testUsername = $"validtest_{Guid.NewGuid():N}@example.com";
        var testPassword = "ValidPassword123!";

        db.Users.Add(new User
        {
            Username = testUsername,
            PasswordHash = hasher.Hash(testPassword),
            Role = "admin",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        // Login with valid credentials
        var request = new { username = testUsername, password = testPassword };
        var response = await _client.PostAsJsonAsync("/api/users/login", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(loginResponse);
        Assert.False(string.IsNullOrEmpty(loginResponse.Token));
    }
}
