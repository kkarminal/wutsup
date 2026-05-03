// Feature: wutsup-foundation, Property 4: API configuration validation identifies missing keys
// Feature: admin-portal, Property 7: ConfigValidator reports missing JWT configuration keys
// Validates: Requirements 6.4, 5.3, 5.4

using System.Collections.Generic;
using System.Linq;

using Microsoft.Extensions.Configuration;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Configuration;

namespace Wutsup.Api.Tests;

/// <summary>
/// Wrapper type for a non-empty subset of required config keys.
/// </summary>
public record NonEmptyKeySubset(string[] Keys);

/// <summary>
/// Custom Arbitrary that generates non-empty subsets of the required config keys.
/// </summary>
public class NonEmptyKeySubsetArbitrary
{
    private static readonly string[] RequiredKeys =
    [
        "ConnectionStrings:DefaultConnection",
        "App:Environment",
        "App:LogLevel",
        "GrowthBook:ApiHost",
        "GrowthBook:ClientKey",
        "Jwt:Secret",
        "Jwt:ExpiryMinutes"
    ];

    public static Arbitrary<NonEmptyKeySubset> Arbitrary()
    {
        var gen = Gen.SubListOf(RequiredKeys)
            .Where(list => list.Count > 0)
            .Select(list => new NonEmptyKeySubset(list.ToArray()));

        return gen.ToArbitrary();
    }
}

public class ConfigValidatorPropertyTests
{
    private static readonly string[] RequiredKeys =
    [
        "ConnectionStrings:DefaultConnection",
        "App:Environment",
        "App:LogLevel",
        "GrowthBook:ApiHost",
        "GrowthBook:ClientKey",
        "Jwt:Secret",
        "Jwt:ExpiryMinutes"
    ];

    /// <summary>
    /// Builds an IConfiguration containing all required keys, then removes the specified keys.
    /// </summary>
    private static IConfiguration BuildConfiguration(IEnumerable<string> keysToRemove)
    {
        var allValues = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5432;Database=test;Username=test;Password=test",
            ["App:Environment"] = "Local",
            ["App:LogLevel"] = "Debug",
            ["GrowthBook:ApiHost"] = "https://cdn.growthbook.io",
            ["GrowthBook:ClientKey"] = "test-client-key",
            ["Jwt:Secret"] = "test-secret-key-that-is-at-least-32-chars-long!",
            ["Jwt:ExpiryMinutes"] = "60"
        };

        foreach (var key in keysToRemove)
        {
            allValues.Remove(key);
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(allValues)
            .Build();
    }

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(NonEmptyKeySubsetArbitrary) })]
    public bool Validate_Returns_Exactly_The_Removed_Keys(NonEmptyKeySubset subset)
    {
        var removedKeys = subset.Keys;
        var configuration = BuildConfiguration(removedKeys);
        var validator = new ConfigValidator();

        var missingKeys = validator.Validate(configuration, "Local");

        var expected = removedKeys.OrderBy(k => k).ToArray();
        var actual = missingKeys.OrderBy(k => k).ToArray();

        return expected.SequenceEqual(actual);
    }
}
