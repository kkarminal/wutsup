// Feature: wutsup-foundation, Property 3: Log level filtering correctness
// Validates: Requirements 5.3, 5.4, 5.5

using System.Linq;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

/// <summary>
/// Wrapper type for a log level filter input combination.
/// </summary>
public record LogFilterInput(string Level, string Environment, bool VerboseLoggingEnabled);

/// <summary>
/// Custom Arbitrary that generates valid combinations of log level, environment, and verbose flag.
/// </summary>
public class LogFilterInputArbitrary
{
    private static readonly string[] LogLevels = ["debug", "info", "warn", "error"];
    private static readonly string[] Environments = ["Local", "QA", "Staging", "Production"];

    public static Arbitrary<LogFilterInput> Arbitrary()
    {
        var gen = from level in Gen.Elements(LogLevels)
                  from environment in Gen.Elements(Environments)
                  from verbose in Gen.Elements(true, false)
                  select new LogFilterInput(level, environment, verbose);

        return gen.ToArbitrary();
    }
}

public class LogLevelFilterPropertyTests
{
    private static readonly HashSet<string> WarnOrError = new(StringComparer.OrdinalIgnoreCase)
    {
        "warn",
        "error"
    };

    /// <summary>
    /// For any log level, any environment, any verbose-flag state:
    /// entry passes filter iff environment is non-production,
    /// OR level is warn/error, OR verbose flag is enabled.
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(LogFilterInputArbitrary) })]
    public bool ShouldLog_Returns_True_Iff_NonProduction_Or_WarnError_Or_VerboseEnabled(LogFilterInput input)
    {
        var filter = new LogLevelFilter();

        var actual = filter.ShouldLog(input.Level, input.Environment, input.VerboseLoggingEnabled);

        var isNonProduction = !string.Equals(input.Environment, "Production", StringComparison.OrdinalIgnoreCase);
        var isWarnOrError = WarnOrError.Contains(input.Level);
        var expected = isNonProduction || isWarnOrError || input.VerboseLoggingEnabled;

        return actual == expected;
    }
}
