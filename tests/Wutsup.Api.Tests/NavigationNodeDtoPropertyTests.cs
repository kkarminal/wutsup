// Feature: category-background-images, Property 1: DTO Mapping Preserves BackgroundImageUrl

using System;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Data;
using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

/// <summary>
/// Generates BackgroundImageUrl values: either null or a valid HTTP/HTTPS URL string.
/// </summary>
public class BackgroundImageUrlArbitrary
{
    private static readonly string[] Schemes = ["http", "https"];
    private static readonly string[] Domains = ["example.com", "images.wutsup.com", "cdn.test.org", "localhost"];
    private static readonly string[] Paths = ["/images/bg.jpeg", "/photos/neon.png", "/assets/background.webp", "/img/cat.jpg", ""];

    public static Gen<string?> BackgroundImageUrlGen() =>
        Gen.OneOf(
            Gen.Constant<string?>(null),
            from scheme in Gen.Elements(Schemes)
            from domain in Gen.Elements(Domains)
            from path in Gen.Elements(Paths)
            select (string?)$"{scheme}://{domain}{path}");

    public static Arbitrary<string?> Arbitrary() => BackgroundImageUrlGen().ToArbitrary();
}

/// <summary>
/// Input record for Property 1 — DTO mapping with BackgroundImageUrl.
/// </summary>
public record DtoMappingInput(string Label, string? Icon, string? BackgroundImageUrl, int SortOrder);

/// <summary>
/// Generates valid DtoMappingInput values for property testing.
/// </summary>
public class DtoMappingInputArbitrary
{
    private static readonly char[] PrintableChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-.".ToCharArray();

    private static Gen<string> NonEmptyLabel() =>
        Gen.ArrayOf(Gen.Elements(PrintableChars))
           .Where(arr => arr.Length > 0 && !string.IsNullOrWhiteSpace(new string(arr)))
           .Select(arr => new string(arr));

    public static Arbitrary<DtoMappingInput> Arbitrary()
    {
        var gen = from label in NonEmptyLabel()
                  from hasIcon in Gen.Elements(true, false)
                  from icon in NonEmptyLabel()
                  from backgroundImageUrl in BackgroundImageUrlArbitrary.BackgroundImageUrlGen()
                  from sortOrder in Gen.Choose(0, 100)
                  select new DtoMappingInput(label, hasIcon ? icon : null, backgroundImageUrl, sortOrder);

        return gen.ToArbitrary();
    }
}

/// <summary>
/// Input record for Property 3 — Omitted BackgroundImageUrl preserves existing value.
/// </summary>
public record OmittedUpdateInput(string OriginalUrl, string NewLabel, bool? UpdateBackgroundImageUrlFlag);

/// <summary>
/// Generates valid OmittedUpdateInput values for property testing.
/// The OriginalUrl is always a non-null valid URL, NewLabel is a non-empty string,
/// and UpdateBackgroundImageUrlFlag is either false or null (never true).
/// </summary>
public class OmittedUpdateInputArbitrary
{
    private static readonly string[] Schemes = ["http", "https"];
    private static readonly string[] Domains = ["example.com", "images.wutsup.com", "cdn.test.org", "localhost"];
    private static readonly string[] Paths = ["/images/bg.jpeg", "/photos/neon.png", "/assets/background.webp", "/img/cat.jpg"];
    private static readonly char[] PrintableChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-.".ToCharArray();

    private static Gen<string> NonNullUrlGen() =>
        from scheme in Gen.Elements(Schemes)
        from domain in Gen.Elements(Domains)
        from path in Gen.Elements(Paths)
        select $"{scheme}://{domain}{path}";

    private static Gen<string> NonEmptyLabel() =>
        Gen.ArrayOf(Gen.Elements(PrintableChars))
           .Where(arr => arr.Length > 0 && !string.IsNullOrWhiteSpace(new string(arr)))
           .Select(arr => new string(arr));

    public static Arbitrary<OmittedUpdateInput> Arbitrary()
    {
        var gen = from originalUrl in NonNullUrlGen()
                  from newLabel in NonEmptyLabel()
                  from flag in Gen.Elements<bool?>(null, false)
                  select new OmittedUpdateInput(originalUrl, newLabel, flag);

        return gen.ToArbitrary();
    }
}

/// <summary>
/// Input record for Property 4 — Invalid URL strings are rejected.
/// </summary>
public record InvalidUrlUpdateInput(string ExistingUrl, string InvalidUrl);

/// <summary>
/// Generates InvalidUrlUpdateInput values where InvalidUrl is NOT a valid absolute HTTP/HTTPS URL.
/// Examples: relative paths, ftp:// URLs, random strings, empty strings, strings without scheme.
/// </summary>
public class InvalidUrlUpdateInputArbitrary
{
    private static readonly string[] Schemes = ["http", "https"];
    private static readonly string[] Domains = ["example.com", "images.wutsup.com", "cdn.test.org"];
    private static readonly string[] Paths = ["/images/bg.jpeg", "/photos/neon.png", "/assets/background.webp"];

    private static Gen<string> ValidUrlGen() =>
        from scheme in Gen.Elements(Schemes)
        from domain in Gen.Elements(Domains)
        from path in Gen.Elements(Paths)
        select $"{scheme}://{domain}{path}";

    private static Gen<string> InvalidUrlGen()
    {
        // Various categories of invalid URLs
        var relativePaths = Gen.Elements("/relative/path", "../images/bg.png", "images/test.jpg", "/foo/bar");
        var ftpUrls = Gen.Elements("ftp://example.com/file.jpg", "ftp://cdn.test.org/image.png");
        var otherSchemes = Gen.Elements("file:///etc/passwd", "mailto:user@example.com", "data:image/png;base64,abc");
        var missingScheme = Gen.Elements("://missing-scheme.com", "://example.com/path");
        var emptyString = Gen.Constant("");
        var randomStrings = Gen.Elements("not-a-url", "just some text", "hello world", "12345", "abc def ghi");
        var malformed = Gen.Elements("http:/missing-slash.com", "https//no-colon.com", "http:", "https:");

        return Gen.OneOf(relativePaths, ftpUrls, otherSchemes, missingScheme, emptyString, randomStrings, malformed);
    }

    public static Arbitrary<InvalidUrlUpdateInput> Arbitrary()
    {
        var gen = from existingUrl in ValidUrlGen()
                  from invalidUrl in InvalidUrlGen()
                  select new InvalidUrlUpdateInput(existingUrl, invalidUrl);

        return gen.ToArbitrary();
    }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

public class NavigationNodeDtoPropertyTests
{
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static NavigationService CreateService(AppDbContext dbContext) =>
        new NavigationService(dbContext);

    // -----------------------------------------------------------------------
    // Property 1 — DTO Mapping Preserves BackgroundImageUrl
    // Validates: Requirements 1.2, 1.3
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(DtoMappingInputArbitrary) })]
    public async Task<bool> ToDto_PreservesBackgroundImageUrl(DtoMappingInput input)
    {
        // Feature: category-background-images, Property 1: DTO Mapping Preserves BackgroundImageUrl
        using var dbContext = CreateInMemoryDbContext();
        var service = CreateService(dbContext);

        // Seed a NavigationNode directly with the generated BackgroundImageUrl
        var node = new NavigationNode
        {
            Label = input.Label,
            Icon = input.Icon,
            BackgroundImageUrl = input.BackgroundImageUrl,
            SortOrder = input.SortOrder,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        dbContext.NavigationNodes.Add(node);
        await dbContext.SaveChangesAsync();

        // Retrieve via the public GetTreeAsync which uses the private ToDto/BuildDto mapping
        var tree = await service.GetTreeAsync();

        // The tree root should be the node we just created
        // Verify the BackgroundImageUrl is preserved in the DTO
        return tree.BackgroundImageUrl == input.BackgroundImageUrl;
    }

    // -----------------------------------------------------------------------
    // Property 2 — BackgroundImageUrl Update Round-Trip
    // Validates: Requirements 1.1, 5.2, 5.3
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(BackgroundImageUrlArbitrary) })]
    public async Task<bool> UpdateNodeAsync_RoundTrips_BackgroundImageUrl(string? backgroundImageUrl)
    {
        // Feature: category-background-images, Property 2: BackgroundImageUrl Update Round-Trip
        using var dbContext = CreateInMemoryDbContext();
        var service = CreateService(dbContext);

        // 1. Create a NavigationNode in the in-memory database
        var node = new NavigationNode
        {
            Label = "TestNode",
            Icon = "star",
            BackgroundImageUrl = null,
            SortOrder = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        dbContext.NavigationNodes.Add(node);
        await dbContext.SaveChangesAsync();

        // 2. Call UpdateNodeAsync with UpdateBackgroundImageUrl = true and the generated value
        var updateRequest = new UpdateNavigationNodeRequest(
            Label: null,
            Icon: null,
            SortOrder: null,
            BackgroundImageUrl: backgroundImageUrl,
            UpdateBackgroundImageUrl: true
        );
        await service.UpdateNodeAsync(node.Id, updateRequest);

        // 3. Retrieve the node via GetTreeAsync
        var tree = await service.GetTreeAsync();

        // 4. Assert the BackgroundImageUrl matches what was set
        return tree.BackgroundImageUrl == backgroundImageUrl;
    }

    // -----------------------------------------------------------------------
    // Property 3 — Omitted BackgroundImageUrl Field Preserves Existing Value
    // Validates: Requirements 5.4
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(OmittedUpdateInputArbitrary) })]
    public async Task<bool> UpdateNodeAsync_OmittedBackgroundImageUrl_PreservesExistingValue(OmittedUpdateInput input)
    {
        // Feature: category-background-images, Property 3: Omitted BackgroundImageUrl Field Preserves Existing Value
        using var dbContext = CreateInMemoryDbContext();
        var service = CreateService(dbContext);

        // 1. Create a NavigationNode with a generated non-null BackgroundImageUrl
        var node = new NavigationNode
        {
            Label = "OriginalLabel",
            Icon = "star",
            BackgroundImageUrl = input.OriginalUrl,
            SortOrder = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        dbContext.NavigationNodes.Add(node);
        await dbContext.SaveChangesAsync();

        // 2. Call UpdateNodeAsync with UpdateBackgroundImageUrl = false/null and a different Label
        var updateRequest = new UpdateNavigationNodeRequest(
            Label: input.NewLabel,
            Icon: null,
            SortOrder: null,
            BackgroundImageUrl: null,
            UpdateBackgroundImageUrl: input.UpdateBackgroundImageUrlFlag // false or null
        );
        await service.UpdateNodeAsync(node.Id, updateRequest);

        // 3. Retrieve the node via GetTreeAsync
        var tree = await service.GetTreeAsync();

        // 4. Assert the BackgroundImageUrl is unchanged from the original value
        return tree.BackgroundImageUrl == input.OriginalUrl;
    }

    // -----------------------------------------------------------------------
    // Property 4 — Invalid URL Strings Are Rejected
    // Validates: Requirements 5.5, 5.6
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(InvalidUrlUpdateInputArbitrary) })]
    public async Task<bool> UpdateNodeAsync_InvalidUrl_ThrowsAndPreservesExistingValue(InvalidUrlUpdateInput input)
    {
        // Feature: category-background-images, Property 4: Invalid URL Strings Are Rejected
        using var dbContext = CreateInMemoryDbContext();
        var service = CreateService(dbContext);

        // 1. Create a NavigationNode with an existing valid BackgroundImageUrl
        var node = new NavigationNode
        {
            Label = "TestNode",
            Icon = "star",
            BackgroundImageUrl = input.ExistingUrl,
            SortOrder = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        dbContext.NavigationNodes.Add(node);
        await dbContext.SaveChangesAsync();

        // 2. Attempt to update with an invalid URL (UpdateBackgroundImageUrl = true)
        var updateRequest = new UpdateNavigationNodeRequest(
            Label: null,
            Icon: null,
            SortOrder: null,
            BackgroundImageUrl: input.InvalidUrl,
            UpdateBackgroundImageUrl: true
        );

        bool threwArgumentException = false;
        try
        {
            await service.UpdateNodeAsync(node.Id, updateRequest);
        }
        catch (ArgumentException)
        {
            threwArgumentException = true;
        }

        // 3. Verify ArgumentException was thrown
        if (!threwArgumentException)
            return false;

        // 4. Verify the existing BackgroundImageUrl is preserved (unchanged)
        var tree = await service.GetTreeAsync();
        return tree.BackgroundImageUrl == input.ExistingUrl;
    }
}
