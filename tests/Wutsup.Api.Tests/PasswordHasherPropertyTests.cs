// Feature: admin-portal, Property 1: Password hashing is non-reversible and non-trivial
// Feature: admin-portal, Property 2: Password verification round-trip
// Validates: Requirements 3.1, 3.2

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

/// <summary>
/// Custom Arbitrary that generates non-empty password strings.
/// </summary>
public class NonEmptyPasswordArbitrary
{
    private static readonly char[] PrintableChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?".ToCharArray();

    private static Gen<string> NonEmptyPasswordGen()
    {
        return Gen.ArrayOf(Gen.Elements(PrintableChars))
            .Where(arr => arr.Length > 0)
            .Select(arr => new string(arr));
    }

    public static Arbitrary<string> Arbitrary()
    {
        return NonEmptyPasswordGen().ToArbitrary();
    }
}

/// <summary>
/// Custom Arbitrary that generates pairs of distinct non-empty password strings.
/// </summary>
public class DistinctPasswordPairArbitrary
{
    private static readonly char[] PrintableChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?".ToCharArray();

    private static Gen<string> NonEmptyPasswordGen()
    {
        return Gen.ArrayOf(Gen.Elements(PrintableChars))
            .Where(arr => arr.Length > 0)
            .Select(arr => new string(arr));
    }

    public static Arbitrary<(string P1, string P2)> Arbitrary()
    {
        var gen = from p1 in NonEmptyPasswordGen()
                  from p2 in NonEmptyPasswordGen()
                  where p1 != p2
                  select (p1, p2);

        return gen.ToArbitrary();
    }
}

public class PasswordHasherPropertyTests
{
    private readonly PasswordHasher _hasher = new();

    /// <summary>
    /// Property 1: Password hashing is non-reversible and non-trivial.
    /// For any non-empty string, Hash(s) != s and Hash(s) is non-empty.
    /// Validates: Requirements 3.1
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(NonEmptyPasswordArbitrary) })]
    public bool Hash_IsNonReversibleAndNonTrivial(string password)
    {
        var hash = _hasher.Hash(password);

        // Hash must be non-empty
        if (string.IsNullOrEmpty(hash)) return false;

        // Hash must not equal the original plaintext
        if (hash == password) return false;

        return true;
    }

    /// <summary>
    /// Property 2a: Password verification round-trip.
    /// For any non-empty string p, Verify(p, Hash(p)) == true.
    /// Validates: Requirements 3.2
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(NonEmptyPasswordArbitrary) })]
    public bool Verify_CorrectPassword_ReturnsTrue(string password)
    {
        var hash = _hasher.Hash(password);
        return _hasher.Verify(password, hash);
    }

    /// <summary>
    /// Property 2b: Password verification round-trip (negative case).
    /// For any two distinct non-empty strings p1 != p2, Verify(p2, Hash(p1)) == false.
    /// Validates: Requirements 3.2
    /// </summary>
    [Property(MaxTest = 100, Arbitrary = new[] { typeof(DistinctPasswordPairArbitrary) })]
    public bool Verify_WrongPassword_ReturnsFalse((string P1, string P2) pair)
    {
        var hash = _hasher.Hash(pair.P1);
        return !_hasher.Verify(pair.P2, hash);
    }
}
