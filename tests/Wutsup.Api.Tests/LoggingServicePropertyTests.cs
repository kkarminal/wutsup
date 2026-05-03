// Feature: wutsup-foundation, Property 2: API log entries contain required fields
// Validates: Requirements 5.2

using System;
using System.Linq;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Data;
using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

/// <summary>
/// Wrapper type for arbitrary log entry input parameters.
/// </summary>
public record LogEntryInput(string Level, string Message, string Source, Guid? CorrelationId);

/// <summary>
/// Custom Arbitrary that generates valid log entry inputs with non-empty strings
/// and an optional correlation ID.
/// </summary>
public class LogEntryInputArbitrary
{
    private static readonly string[] LogLevels = ["debug", "info", "warn", "error"];

    private static readonly char[] AlphaChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-.".ToCharArray();

    /// <summary>
    /// Generates a non-empty string of 1–50 alphanumeric characters.
    /// </summary>
    private static Gen<string> NonEmptyAlphaString()
    {
        return Gen.ArrayOf(Gen.Elements(AlphaChars))
            .Where(arr => arr.Length > 0)
            .Select(arr => new string(arr));
    }

    public static Arbitrary<LogEntryInput> Arbitrary()
    {
        var gen = from level in Gen.Elements(LogLevels)
                  from message in NonEmptyAlphaString()
                  from source in NonEmptyAlphaString()
                  from hasCorrelationId in Gen.Elements(true, false)
                  select new LogEntryInput(
                      level,
                      message,
                      source,
                      hasCorrelationId ? Guid.NewGuid() : null);

        return gen.ToArbitrary();
    }
}

/// <summary>
/// A LogLevelFilter that allows all log entries through, regardless of environment or verbose flag.
/// </summary>
public class AllowAllLogLevelFilter : ILogLevelFilter
{
    public bool ShouldLog(string level, string environment, bool verboseLoggingEnabled) => true;
}

public class LoggingServicePropertyTests
{
    /// <summary>
    /// Creates a fresh in-memory AppDbContext with a unique database name per test run.
    /// </summary>
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    /// <summary>
    /// Creates a minimal IConfiguration for the LoggingService constructor.
    /// Uses "Local" environment so all log levels pass through.
    /// </summary>
    private static IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["App:Environment"] = "Local",
                ["GrowthBook:VerboseLogging"] = "false"
            })
            .Build();
    }

    /// <summary>
    /// For any log entry created by the API Logger, the resulting LogEntry has
    /// non-null/non-empty values for Timestamp, Level, Message, Source,
    /// and the CorrelationId field exists.
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(LogEntryInputArbitrary) })]
    public async Task<bool> LogAsync_Persists_Entry_With_All_Required_Fields(LogEntryInput input)
    {
        using var dbContext = CreateInMemoryDbContext();
        var configuration = CreateConfiguration();
        var filter = new AllowAllLogLevelFilter();
        var service = new LoggingService(dbContext, filter, configuration);

        await service.LogAsync(input.Level, input.Message, input.Source, input.CorrelationId);

        var entry = await dbContext.Logs.FirstOrDefaultAsync();

        if (entry == null)
        {
            return false;
        }

        var hasTimestamp = entry.Timestamp != default;
        var hasLevel = !string.IsNullOrEmpty(entry.Level);
        var hasMessage = !string.IsNullOrEmpty(entry.Message);
        var hasSource = !string.IsNullOrEmpty(entry.Source);
        var hasCreatedAt = entry.CreatedAt != default;

        // CorrelationId field must exist (it's nullable, so we just verify
        // it matches what was passed in — the field is present on the entity)
        var correlationIdFieldExists = entry.CorrelationId == input.CorrelationId;

        return hasTimestamp && hasLevel && hasMessage && hasSource && hasCreatedAt && correlationIdFieldExists;
    }
}
