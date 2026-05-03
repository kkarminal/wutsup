// Feature: admin-portal, Property 5: JWT contains role claim matching the user's stored role
// Feature: admin-portal, Property 6: JWT expiry reflects configured duration
// Validates: Requirements 4.5, 4.6

using System.IdentityModel.Tokens.Jwt;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Microsoft.Extensions.Configuration;

using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

/// <summary>
/// Custom Arbitrary that generates valid non-empty role strings.
/// </summary>
public class NonEmptyRoleArbitrary
{
    private static readonly char[] AlphaChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-".ToCharArray();

    public static Arbitrary<string> Arbitrary()
    {
        return Gen.ArrayOf(Gen.Elements(AlphaChars))
            .Where(arr => arr.Length > 0)
            .Select(arr => new string(arr))
            .ToArbitrary();
    }
}

/// <summary>
/// Custom Arbitrary that generates valid positive ExpiryMinutes values (1–1440).
/// </summary>
public class PositiveExpiryMinutesArbitrary
{
    public static Arbitrary<int> Arbitrary()
    {
        return Gen.Choose(1, 1440).ToArbitrary();
    }
}

public class JwtServicePropertyTests
{
    private static readonly string TestSecret = "test-secret-key-that-is-at-least-32-chars-long!";
    private static readonly string TestUsername = "test@example.com";

    private static IConfiguration BuildConfiguration(int expiryMinutes)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = TestSecret,
                ["Jwt:ExpiryMinutes"] = expiryMinutes.ToString()
            })
            .Build();
    }

    private static JwtSecurityToken DecodeToken(string tokenString)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(tokenString);
    }

    /// <summary>
    /// Property 5: JWT contains role claim matching the user's stored role.
    /// For any username and any non-empty role string, the decoded JWT contains
    /// a "role" claim equal to that role.
    /// Validates: Requirements 4.5
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(NonEmptyRoleArbitrary) })]
    public bool GenerateToken_ContainsRoleClaim(string role)
    {
        var configuration = BuildConfiguration(60);
        var service = new JwtService(configuration);

        var tokenString = service.GenerateToken(TestUsername, role);
        var token = DecodeToken(tokenString);

        var roleClaim = token.Claims.FirstOrDefault(c => c.Type == "role");
        if (roleClaim == null) return false;

        return roleClaim.Value == role;
    }

    /// <summary>
    /// Property 6: JWT expiry reflects configured duration.
    /// For any ExpiryMinutes value, the JWT exp claim equals iat + (ExpiryMinutes * 60)
    /// within a 5-second tolerance.
    /// Validates: Requirements 4.6
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(PositiveExpiryMinutesArbitrary) })]
    public bool GenerateToken_ExpiryReflectsConfiguredDuration(int expiryMinutes)
    {
        var configuration = BuildConfiguration(expiryMinutes);
        var service = new JwtService(configuration);

        var tokenString = service.GenerateToken(TestUsername, "admin");
        var token = DecodeToken(tokenString);

        var iatClaim = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Iat);
        if (iatClaim == null || !long.TryParse(iatClaim.Value, out var iat)) return false;

        var exp = new DateTimeOffset(token.ValidTo, TimeSpan.Zero).ToUnixTimeSeconds();

        var expectedExp = iat + (expiryMinutes * 60L);
        var tolerance = 5L; // 5-second tolerance

        return Math.Abs(exp - expectedExp) <= tolerance;
    }
}
