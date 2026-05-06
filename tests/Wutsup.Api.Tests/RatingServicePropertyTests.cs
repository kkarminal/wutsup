// Feature: discovery-ratings-reviews, Property 1: Places API response parsing preserves data
// Feature: discovery-ratings-reviews, Property 3: Cache hit returns stored data without external API call
// Feature: discovery-ratings-reviews, Property 6: Response DTO includes rating fields with correct structure
// Feature: discovery-ratings-reviews, Property 7: Enrichment applies cached data to all items

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

// ---------------------------------------------------------------------------
// Generators for RatingService property tests
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated cache hit scenario with a valid (non-expired) cache entry.
/// </summary>
public record CacheHitInput(
    int DiscoveryItemId,
    string ItemName,
    double Latitude,
    double Longitude,
    RatingData CachedRatingData,
    DateTimeOffset ExpiresAt
);

public static class CacheHitInputGenerator
{
    public static Gen<CacheHitInput> GenCacheHitInput()
    {
        return from discoveryItemId in Gen.Choose(1, 10000)
               from itemName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from ratingData in GenRatingData()
               from minutesUntilExpiry in Gen.Choose(1, 14400) // 1 minute to 10 days in the future
               let expiresAt = DateTimeOffset.UtcNow.AddMinutes(minutesUntilExpiry)
               select new CacheHitInput(discoveryItemId, itemName, latitude, longitude, ratingData, expiresAt);
    }

    private static Gen<RatingData> GenRatingData()
    {
        return from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from reviewCount in Gen.Choose(0, 5000)
               from reviewListCount in Gen.Choose(0, 5)
               from reviews in Gen.ArrayOf(GenReviewData(), reviewListCount)
               select new RatingData(rating, reviewCount, reviews.ToList());
    }

    private static Gen<ReviewData> GenReviewData()
    {
        return from authorName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0)
               from text in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from relativeTime in Gen.Elements("a day ago", "2 weeks ago", "a month ago", "3 months ago", "a year ago")
               select new ReviewData(authorName, rating, text, relativeTime);
    }

    public static Arbitrary<CacheHitInput> Arbitrary() => GenCacheHitInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Generator for API error scenarios (Property 2)
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated API error scenario for testing graceful degradation.
/// </summary>
public record ApiErrorInput(
    int DiscoveryItemId,
    string ItemName,
    double Latitude,
    double Longitude,
    Exception ErrorException,
    string ErrorDescription
);

public static class ApiErrorInputGenerator
{
    public static Gen<ApiErrorInput> GenApiErrorInput()
    {
        return from discoveryItemId in Gen.Choose(1, 10000)
               from itemName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from errorCase in GenErrorException()
               select new ApiErrorInput(discoveryItemId, itemName, latitude, longitude, errorCase.Item1, errorCase.Item2);
    }

    private static Gen<Tuple<Exception, string>> GenErrorException()
    {
        return Gen.Elements(
            Tuple.Create<Exception, string>(
                new HttpRequestException("Service unavailable", null, HttpStatusCode.ServiceUnavailable),
                "HTTP 503 Service Unavailable"),
            Tuple.Create<Exception, string>(
                new HttpRequestException("Internal server error", null, HttpStatusCode.InternalServerError),
                "HTTP 500 Internal Server Error"),
            Tuple.Create<Exception, string>(
                new HttpRequestException("Bad request", null, HttpStatusCode.BadRequest),
                "HTTP 400 Bad Request"),
            Tuple.Create<Exception, string>(
                new HttpRequestException("Forbidden", null, HttpStatusCode.Forbidden),
                "HTTP 403 Forbidden"),
            Tuple.Create<Exception, string>(
                new HttpRequestException("Not found", null, HttpStatusCode.NotFound),
                "HTTP 404 Not Found"),
            Tuple.Create<Exception, string>(
                new TaskCanceledException("The request was canceled due to the configured HttpClient.Timeout",
                    new TimeoutException("A task was canceled.")),
                "Timeout"),
            Tuple.Create<Exception, string>(
                new HttpRequestException("No such host is known"),
                "Network failure")
        );
    }

    public static Arbitrary<ApiErrorInput> Arbitrary() => GenApiErrorInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Generator for cache miss scenarios (Property 4)
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated cache miss scenario where no valid cache entry exists.
/// </summary>
public record CacheMissInput(
    int DiscoveryItemId,
    string ItemName,
    double Latitude,
    double Longitude,
    PlacesDetailResult PlacesResult
);

public static class CacheMissInputGenerator
{
    public static Gen<CacheMissInput> GenCacheMissInput()
    {
        return from discoveryItemId in Gen.Choose(1, 10000)
               from itemName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from placesResult in GenPlacesDetailResult()
               select new CacheMissInput(discoveryItemId, itemName, latitude, longitude, placesResult);
    }

    private static Gen<PlacesDetailResult> GenPlacesDetailResult()
    {
        return from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from reviewCount in Gen.Choose(0, 5000)
               from reviewListCount in Gen.Choose(0, 5)
               from reviews in Gen.ArrayOf(GenReviewData(), reviewListCount)
               select new PlacesDetailResult(rating, reviewCount, reviews.ToList(), null, null);
    }

    private static Gen<ReviewData> GenReviewData()
    {
        return from authorName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0)
               from text in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from relativeTime in Gen.Elements("a day ago", "2 weeks ago", "a month ago", "3 months ago", "a year ago")
               select new ReviewData(authorName, rating, text, relativeTime);
    }

    public static Arbitrary<CacheMissInput> Arbitrary() => GenCacheMissInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Generator for enrichment DTO structure scenarios (Property 6)
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a single discovery item with an optional cached rating for enrichment testing.
/// </summary>
public record EnrichmentItemInput(
    DiscoveryItemDto Item,
    RatingData? CachedRating
);

/// <summary>
/// Represents a generated list of discovery items, some with cached ratings and some without.
/// </summary>
public record EnrichmentInput(List<EnrichmentItemInput> Items);

public static class EnrichmentInputGenerator
{
    public static Gen<EnrichmentInput> GenEnrichmentInput()
    {
        return from count in Gen.Choose(1, 15)
               from items in Gen.ArrayOf(GenEnrichmentItemInput(), count)
               select new EnrichmentInput(items.ToList());
    }

    private static Gen<EnrichmentItemInput> GenEnrichmentItemInput()
    {
        return from id in Gen.Choose(1, 10000)
               from name in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from city in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from hasCachedRating in Gen.Elements(true, false)
               from ratingData in GenRatingData()
               let item = new DiscoveryItemDto(id, name, "Description", latitude, longitude, city, null, null, 1, "Category", null)
               select new EnrichmentItemInput(item, hasCachedRating ? ratingData : null);
    }

    private static Gen<RatingData> GenRatingData()
    {
        return from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from reviewCount in Gen.Choose(0, 5000)
               from reviewListCount in Gen.Choose(0, 5)
               from reviews in Gen.ArrayOf(GenReviewData(), reviewListCount)
               select new RatingData(rating, reviewCount, reviews.ToList());
    }

    private static Gen<ReviewData> GenReviewData()
    {
        return from authorName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0)
               from text in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from relativeTime in Gen.Elements("a day ago", "2 weeks ago", "a month ago", "3 months ago", "a year ago")
               select new ReviewData(authorName, rating, text, relativeTime);
    }

    public static Arbitrary<EnrichmentInput> Arbitrary() => GenEnrichmentInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Generator for enrichment with ALL items having cached ratings (Property 7)
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated list of discovery items where ALL items have valid cache entries.
/// Used to verify that enrichment applies cached data to every item.
/// </summary>
public record AllCachedEnrichmentInput(List<EnrichmentItemInput> Items);

public static class AllCachedEnrichmentInputGenerator
{
    public static Gen<AllCachedEnrichmentInput> GenAllCachedEnrichmentInput()
    {
        return from count in Gen.Choose(1, 15)
               from items in Gen.ArrayOf(GenItemWithCachedRating(), count)
               // Assign unique sequential IDs to avoid duplicate ID collisions in mock setup
               let uniqueItems = items.Select((item, index) =>
               {
                   var uniqueItem = new DiscoveryItemDto(
                       index + 1,
                       item.Item.Name,
                       item.Item.Description,
                       item.Item.Latitude,
                       item.Item.Longitude,
                       item.Item.City,
                       item.Item.Address,
                       item.Item.ImageUrl,
                       item.Item.NavigationNodeId,
                       item.Item.CategoryLabel,
                       item.Item.Metadata);
                   return new EnrichmentItemInput(uniqueItem, item.CachedRating);
               }).ToList()
               select new AllCachedEnrichmentInput(uniqueItems);
    }

    private static Gen<EnrichmentItemInput> GenItemWithCachedRating()
    {
        return from name in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from city in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from ratingData in GenRatingData()
               let item = new DiscoveryItemDto(0, name, "Description", latitude, longitude, city, null, null, 1, "Category", null)
               select new EnrichmentItemInput(item, ratingData); // Always has cached rating
    }

    private static Gen<RatingData> GenRatingData()
    {
        return from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from reviewCount in Gen.Choose(0, 5000)
               from reviewListCount in Gen.Choose(0, 5)
               from reviews in Gen.ArrayOf(GenReviewData(), reviewListCount)
               select new RatingData(rating, reviewCount, reviews.ToList());
    }

    private static Gen<ReviewData> GenReviewData()
    {
        return from authorName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0)
               from text in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from relativeTime in Gen.Elements("a day ago", "2 weeks ago", "a month ago", "3 months ago", "a year ago")
               select new ReviewData(authorName, rating, text, relativeTime);
    }

    public static Arbitrary<AllCachedEnrichmentInput> Arbitrary() => GenAllCachedEnrichmentInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Generator for Places API response parsing (Property 1)
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated valid Google Places API response for testing parsing.
/// </summary>
public record PlacesApiResponseInput(
    string ItemName,
    double Latitude,
    double Longitude,
    double Rating,
    int UserRatingsTotal,
    List<PlacesReviewInput> Reviews
);

public record PlacesReviewInput(
    string AuthorName,
    double Rating,
    string Text,
    string RelativeTimeDescription
);

public static class PlacesApiResponseInputGenerator
{
    public static Gen<PlacesApiResponseInput> GenPlacesApiResponseInput()
    {
        return from itemName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from userRatingsTotal in Gen.Choose(0, 10000)
               from reviewCount in Gen.Choose(0, 5)
               from reviews in Gen.ArrayOf(GenPlacesReviewInput(), reviewCount)
               select new PlacesApiResponseInput(itemName, latitude, longitude, rating, userRatingsTotal, reviews.ToList());
    }

    private static Gen<PlacesReviewInput> GenPlacesReviewInput()
    {
        return from authorName in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from rating in Gen.Choose(0, 50).Select(v => v / 10.0) // 0.0 to 5.0
               from text in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from relativeTime in Gen.Elements("a day ago", "2 weeks ago", "a month ago", "3 months ago", "a year ago")
               select new PlacesReviewInput(authorName, rating, text, relativeTime);
    }

    public static Arbitrary<PlacesApiResponseInput> Arbitrary() => GenPlacesApiResponseInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Mock HttpMessageHandler for PlacesClient tests
// ---------------------------------------------------------------------------

/// <summary>
/// A mock HttpMessageHandler that returns pre-configured responses based on URL patterns.
/// </summary>
public class MockPlacesHttpMessageHandler : HttpMessageHandler
{
    private readonly string _findPlaceResponseJson;
    private readonly string _placeDetailsResponseJson;

    public MockPlacesHttpMessageHandler(string findPlaceResponseJson, string placeDetailsResponseJson)
    {
        _findPlaceResponseJson = findPlaceResponseJson;
        _placeDetailsResponseJson = placeDetailsResponseJson;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var url = request.RequestUri?.ToString() ?? string.Empty;

        string responseJson;
        if (url.Contains("findplacefromtext"))
        {
            responseJson = _findPlaceResponseJson;
        }
        else if (url.Contains("details"))
        {
            responseJson = _placeDetailsResponseJson;
        }
        else
        {
            responseJson = "{}";
        }

        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseJson, System.Text.Encoding.UTF8, "application/json")
        };

        return Task.FromResult(response);
    }
}

// ---------------------------------------------------------------------------
// Property tests for RatingService
// ---------------------------------------------------------------------------

public class RatingServicePropertyTests
{
    // -----------------------------------------------------------------------
    // Property 1 — Places API response parsing preserves data
    // Validates: Requirements 1.2
    //
    // For any valid Google Places API response containing a rating (0–5) and
    // up to 5 reviews, parsing the response into a PlacesDetailResult SHALL
    // preserve the rating value and all review fields (author name, rating,
    // text, relative time) without data loss, and the review count SHALL
    // never exceed 5.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(PlacesApiResponseInputGenerator) })]
    public async Task<bool> GetRatingAsync_ParsesResponsePreservingAllData(PlacesApiResponseInput input)
    {
        // Feature: discovery-ratings-reviews, Property 1: Places API response parsing preserves data
        // **Validates: Requirements 1.2**

        // Arrange: Build a fake Google Places API JSON response
        var findPlaceJson = JsonSerializer.Serialize(new
        {
            candidates = new[] { new { place_id = "test_place_id_123" } },
            status = "OK"
        });

        var reviewsJson = input.Reviews.Select(r => new
        {
            author_name = r.AuthorName,
            rating = r.Rating,
            text = r.Text,
            relative_time_description = r.RelativeTimeDescription
        }).ToArray();

        var placeDetailsJson = JsonSerializer.Serialize(new
        {
            result = new
            {
                rating = input.Rating,
                user_ratings_total = input.UserRatingsTotal,
                reviews = reviewsJson
            },
            status = "OK"
        });

        var handler = new MockPlacesHttpMessageHandler(findPlaceJson, placeDetailsJson);
        var httpClient = new HttpClient(handler);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GooglePlaces:ApiKey"] = "test-api-key",
                ["GooglePlaces:BaseUrl"] = "https://maps.googleapis.com/maps/api/place"
            })
            .Build();

        var logger = new Mock<ILogger<PlacesClient>>();
        var placesClient = new PlacesClient(httpClient, configuration, logger.Object);

        // Act
        var result = await placesClient.GetRatingAsync(input.ItemName, input.Latitude, input.Longitude);

        // Assert: result should not be null
        if (result is null)
            return false;

        // Rating should be preserved (clamped to 0-5, but our generator only produces 0-5)
        if (result.Rating != input.Rating)
            return false;

        // ReviewCount should match user_ratings_total
        if (result.ReviewCount != input.UserRatingsTotal)
            return false;

        // Reviews list should have at most 5 items
        if (result.Reviews.Count > 5)
            return false;

        // Reviews count should match input (since generator produces 0-5 reviews)
        if (result.Reviews.Count != input.Reviews.Count)
            return false;

        // Each review's fields should match the input
        for (int i = 0; i < result.Reviews.Count; i++)
        {
            if (result.Reviews[i].AuthorName != input.Reviews[i].AuthorName)
                return false;
            if (result.Reviews[i].Rating != input.Reviews[i].Rating)
                return false;
            if (result.Reviews[i].Text != input.Reviews[i].Text)
                return false;
            if (result.Reviews[i].RelativeTimeDescription != input.Reviews[i].RelativeTimeDescription)
                return false;
        }

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 2 — API errors produce null rating without throwing
    // Validates: Requirements 1.3, 1.4
    //
    // For any Google Places API error response (HTTP 4xx, 5xx, timeout,
    // network failure), the RatingService SHALL return null rating data for
    // the requested item without throwing an exception, and the discovery
    // item SHALL remain intact.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(ApiErrorInputGenerator) })]
    public async Task<bool> GetRatingForItemAsync_ReturnsNull_WhenPlacesClientThrows(ApiErrorInput input)
    {
        // Feature: discovery-ratings-reviews, Property 2: API errors produce null rating without throwing
        // **Validates: Requirements 1.3, 1.4**

        // Arrange
        var mockCacheStore = new Mock<IRatingCacheStore>();
        var mockPlacesClient = new Mock<IPlacesClient>();

        // Cache miss — GetAsync returns null so we hit the PlacesClient path
        mockCacheStore
            .Setup(cs => cs.GetAsync(input.DiscoveryItemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RatingCacheEntry?)null);

        // PlacesClient throws the generated exception
        mockPlacesClient
            .Setup(pc => pc.GetRatingAsync(input.ItemName, input.Latitude, input.Longitude, It.IsAny<CancellationToken>()))
            .ThrowsAsync(input.ErrorException);

        var mockLogger = new Mock<ILogger<RatingService>>();
        var ratingService = new RatingService(mockCacheStore.Object, mockPlacesClient.Object, mockLogger.Object);

        // Act — should NOT throw
        RatingData? result;
        try
        {
            result = await ratingService.GetRatingForItemAsync(
                input.DiscoveryItemId,
                input.ItemName,
                input.Latitude,
                input.Longitude);
        }
        catch (Exception)
        {
            // If an exception propagates, the property is violated
            return false;
        }

        // Assert: result should be null (graceful degradation)
        if (result is not null)
            return false;

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 3 — Cache hit returns stored data without external API call
    // Validates: Requirements 2.1, 2.2
    //
    // For any discovery item ID with a cached entry whose ExpiresAt is in the
    // future, the RatingService SHALL return the cached RatingData without
    // invoking the PlacesClient.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(CacheHitInputGenerator) })]
    public async Task<bool> GetRatingForItemAsync_ReturnsCachedData_WhenCacheHitWithFutureExpiry(CacheHitInput input)
    {
        // Feature: discovery-ratings-reviews, Property 3: Cache hit returns stored data without external API call
        // **Validates: Requirements 2.1, 2.2**

        // Arrange
        var mockCacheStore = new Mock<IRatingCacheStore>();
        var mockPlacesClient = new Mock<IPlacesClient>();

        // Set up cache store to return a valid entry with future ExpiresAt
        var cacheEntry = new RatingCacheEntry
        {
            Id = 1,
            DiscoveryItemId = input.DiscoveryItemId,
            RatingDataJson = JsonSerializer.Serialize(input.CachedRatingData),
            CachedAt = DateTimeOffset.UtcNow.AddHours(-1),
            ExpiresAt = input.ExpiresAt // Always in the future (guaranteed by generator)
        };

        mockCacheStore
            .Setup(cs => cs.GetAsync(input.DiscoveryItemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cacheEntry);

        var mockLogger = new Mock<ILogger<RatingService>>();
        var ratingService = new RatingService(mockCacheStore.Object, mockPlacesClient.Object, mockLogger.Object);

        // Act
        var result = await ratingService.GetRatingForItemAsync(
            input.DiscoveryItemId,
            input.ItemName,
            input.Latitude,
            input.Longitude);

        // Assert: The result should match the cached rating data
        if (result is null)
            return false;

        if (result.Rating != input.CachedRatingData.Rating)
            return false;

        if (result.ReviewCount != input.CachedRatingData.ReviewCount)
            return false;

        if (result.Reviews.Count != input.CachedRatingData.Reviews.Count)
            return false;

        for (int i = 0; i < result.Reviews.Count; i++)
        {
            if (result.Reviews[i].AuthorName != input.CachedRatingData.Reviews[i].AuthorName)
                return false;
            if (result.Reviews[i].Rating != input.CachedRatingData.Reviews[i].Rating)
                return false;
            if (result.Reviews[i].Text != input.CachedRatingData.Reviews[i].Text)
                return false;
            if (result.Reviews[i].RelativeTimeDescription != input.CachedRatingData.Reviews[i].RelativeTimeDescription)
                return false;
        }

        // Assert: PlacesClient should NOT have been called
        mockPlacesClient.Verify(
            pc => pc.GetRatingAsync(
                It.IsAny<string>(),
                It.IsAny<double>(),
                It.IsAny<double>(),
                It.IsAny<CancellationToken>()),
            Times.Never());

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 4 — Cache miss fetches from API and stores by item ID
    // Validates: Requirements 2.3, 2.4
    //
    // For any discovery item ID without a cached entry (or with an expired
    // entry), the RatingService SHALL call the PlacesClient, and if successful,
    // store the result in the cache keyed by that item ID with the configured TTL.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(CacheMissInputGenerator) })]
    public async Task<bool> GetRatingForItemAsync_CallsPlacesClientAndStoresInCache_WhenCacheMiss(CacheMissInput input)
    {
        // Feature: discovery-ratings-reviews, Property 4: Cache miss fetches from API and stores by item ID
        // **Validates: Requirements 2.3, 2.4**

        // Arrange
        var mockCacheStore = new Mock<IRatingCacheStore>();
        var mockPlacesClient = new Mock<IPlacesClient>();

        // Cache miss — GetAsync returns null
        mockCacheStore
            .Setup(cs => cs.GetAsync(input.DiscoveryItemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RatingCacheEntry?)null);

        // PlacesClient returns a valid result
        mockPlacesClient
            .Setup(pc => pc.GetRatingAsync(input.ItemName, input.Latitude, input.Longitude, It.IsAny<CancellationToken>()))
            .ReturnsAsync(input.PlacesResult);

        var mockLogger = new Mock<ILogger<RatingService>>();
        var ratingService = new RatingService(mockCacheStore.Object, mockPlacesClient.Object, mockLogger.Object);

        // Act
        var result = await ratingService.GetRatingForItemAsync(
            input.DiscoveryItemId,
            input.ItemName,
            input.Latitude,
            input.Longitude);

        // Assert: PlacesClient SHOULD have been called
        mockPlacesClient.Verify(
            pc => pc.GetRatingAsync(input.ItemName, input.Latitude, input.Longitude, It.IsAny<CancellationToken>()),
            Times.Once());

        // Assert: Cache SetAsync SHOULD have been called with the correct discoveryItemId
        mockCacheStore.Verify(
            cs => cs.SetAsync(
                input.DiscoveryItemId,
                It.Is<RatingData>(rd =>
                    rd.Rating == input.PlacesResult.Rating &&
                    rd.ReviewCount == input.PlacesResult.ReviewCount &&
                    rd.Reviews.Count == input.PlacesResult.Reviews.Count),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()),
            Times.Once());

        // Assert: The returned result should match the Places API data
        if (result is null)
            return false;

        if (result.Rating != input.PlacesResult.Rating)
            return false;

        if (result.ReviewCount != input.PlacesResult.ReviewCount)
            return false;

        if (result.Reviews.Count != input.PlacesResult.Reviews.Count)
            return false;

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 6 — Response DTO includes rating fields with correct structure
    // Validates: Requirements 6.1, 6.3, 6.4
    //
    // For any set of discovery items (some with cached ratings, some without),
    // the enriched response DTO SHALL include a rating field for every item —
    // containing rating (number 0–5), reviewCount (number), and reviews
    // (array of up to 5 objects with authorName, rating, text,
    // relativeTimeDescription) when data is available, or null when
    // unavailable — without failing the request.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(EnrichmentInputGenerator) })]
    public async Task<bool> EnrichItemsAsync_ResponseDtoIncludesRatingFieldsWithCorrectStructure(EnrichmentInput input)
    {
        // Feature: discovery-ratings-reviews, Property 6: Response DTO includes rating fields with correct structure
        // **Validates: Requirements 6.1, 6.3, 6.4**

        // Arrange
        var mockCacheStore = new Mock<IRatingCacheStore>();
        var mockPlacesClient = new Mock<IPlacesClient>();

        // Set up cache store: return cache entries for items that have cached ratings, null for others
        foreach (var enrichmentItem in input.Items)
        {
            if (enrichmentItem.CachedRating is not null)
            {
                var cacheEntry = new RatingCacheEntry
                {
                    Id = enrichmentItem.Item.Id,
                    DiscoveryItemId = enrichmentItem.Item.Id,
                    RatingDataJson = JsonSerializer.Serialize(enrichmentItem.CachedRating),
                    CachedAt = DateTimeOffset.UtcNow.AddHours(-1),
                    ExpiresAt = DateTimeOffset.UtcNow.AddHours(23)
                };

                mockCacheStore
                    .Setup(cs => cs.GetAsync(enrichmentItem.Item.Id, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cacheEntry);
            }
            else
            {
                mockCacheStore
                    .Setup(cs => cs.GetAsync(enrichmentItem.Item.Id, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((RatingCacheEntry?)null);
            }
        }

        // PlacesClient returns null for items without cache (so they get null rating)
        mockPlacesClient
            .Setup(pc => pc.GetRatingAsync(It.IsAny<string>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PlacesDetailResult?)null);

        var mockLogger = new Mock<ILogger<RatingService>>();
        var ratingService = new RatingService(mockCacheStore.Object, mockPlacesClient.Object, mockLogger.Object);

        // Act — should NOT throw
        List<EnrichedDiscoveryItemDto> result;
        try
        {
            var itemList = input.Items.Select(i => i.Item).ToList();
            result = await ratingService.EnrichItemsAsync(itemList);
        }
        catch (Exception)
        {
            // If an exception propagates, the property is violated
            return false;
        }

        // Assert: Total items in response equals total items in input
        if (result.Count != input.Items.Count)
            return false;

        // Assert: Every item in the result has the correct structure
        for (int i = 0; i < input.Items.Count; i++)
        {
            var expectedItem = input.Items[i];
            var actualItem = result[i];

            // Verify base DTO fields are preserved
            if (actualItem.Id != expectedItem.Item.Id)
                return false;
            if (actualItem.Name != expectedItem.Item.Name)
                return false;

            if (expectedItem.CachedRating is not null)
            {
                // Items with cached data should have rating field with correct sub-fields
                if (actualItem.Rating is null)
                    return false;

                // Rating must be between 0 and 5
                if (actualItem.Rating.Rating < 0 || actualItem.Rating.Rating > 5)
                    return false;

                // ReviewCount must be a non-negative number
                if (actualItem.Rating.ReviewCount < 0)
                    return false;

                // Reviews array must have at most 5 items
                if (actualItem.Rating.Reviews.Count > 5)
                    return false;

                // Each review must have the required fields
                foreach (var review in actualItem.Rating.Reviews)
                {
                    if (string.IsNullOrEmpty(review.AuthorName))
                        return false;
                    if (review.Rating < 0 || review.Rating > 5)
                        return false;
                    if (string.IsNullOrEmpty(review.Text))
                        return false;
                    if (string.IsNullOrEmpty(review.RelativeTimeDescription))
                        return false;
                }

                // Verify the data matches what was cached
                if (actualItem.Rating.Rating != expectedItem.CachedRating.Rating)
                    return false;
                if (actualItem.Rating.ReviewCount != expectedItem.CachedRating.ReviewCount)
                    return false;
                if (actualItem.Rating.Reviews.Count != expectedItem.CachedRating.Reviews.Count)
                    return false;
            }
            else
            {
                // Items without cached data should have null rating field
                if (actualItem.Rating is not null)
                    return false;
            }
        }

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 7 — Enrichment applies cached data to all items
    // Validates: Requirements 6.2
    //
    // For any list of discovery items passed to EnrichItemsAsync, every item
    // with a valid cache entry SHALL have its rating data populated in the
    // response, and the total number of items in the response SHALL equal the
    // total number of items in the input.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(AllCachedEnrichmentInputGenerator) })]
    public async Task<bool> EnrichItemsAsync_AppliesCachedDataToAllItems(AllCachedEnrichmentInput input)
    {
        // Feature: discovery-ratings-reviews, Property 7: Enrichment applies cached data to all items
        // **Validates: Requirements 6.2**

        // Arrange
        var mockCacheStore = new Mock<IRatingCacheStore>();
        var mockPlacesClient = new Mock<IPlacesClient>();

        // Set up cache store: return a valid cache entry for EVERY item
        foreach (var enrichmentItem in input.Items)
        {
            var cacheEntry = new RatingCacheEntry
            {
                Id = enrichmentItem.Item.Id,
                DiscoveryItemId = enrichmentItem.Item.Id,
                RatingDataJson = JsonSerializer.Serialize(enrichmentItem.CachedRating!),
                CachedAt = DateTimeOffset.UtcNow.AddHours(-1),
                ExpiresAt = DateTimeOffset.UtcNow.AddHours(23)
            };

            mockCacheStore
                .Setup(cs => cs.GetAsync(enrichmentItem.Item.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(cacheEntry);
        }

        var mockLogger = new Mock<ILogger<RatingService>>();
        var ratingService = new RatingService(mockCacheStore.Object, mockPlacesClient.Object, mockLogger.Object);

        // Act
        List<EnrichedDiscoveryItemDto> result;
        try
        {
            var itemList = input.Items.Select(i => i.Item).ToList();
            result = await ratingService.EnrichItemsAsync(itemList);
        }
        catch (Exception)
        {
            // If an exception propagates, the property is violated
            return false;
        }

        // Assert: Total number of enriched items equals the input count
        if (result.Count != input.Items.Count)
            return false;

        // Assert: Every item in the result has non-null rating data (since all have cache entries)
        for (int i = 0; i < input.Items.Count; i++)
        {
            var expectedItem = input.Items[i];
            var actualItem = result[i];

            // Rating must not be null — all items have valid cache entries
            if (actualItem.Rating is null)
                return false;

            // Each item's rating data must match what was in the cache
            if (actualItem.Rating.Rating != expectedItem.CachedRating!.Rating)
                return false;
            if (actualItem.Rating.ReviewCount != expectedItem.CachedRating.ReviewCount)
                return false;
            if (actualItem.Rating.Reviews.Count != expectedItem.CachedRating.Reviews.Count)
                return false;

            // Verify individual review fields match
            for (int j = 0; j < actualItem.Rating.Reviews.Count; j++)
            {
                if (actualItem.Rating.Reviews[j].AuthorName != expectedItem.CachedRating.Reviews[j].AuthorName)
                    return false;
                if (actualItem.Rating.Reviews[j].Rating != expectedItem.CachedRating.Reviews[j].Rating)
                    return false;
                if (actualItem.Rating.Reviews[j].Text != expectedItem.CachedRating.Reviews[j].Text)
                    return false;
                if (actualItem.Rating.Reviews[j].RelativeTimeDescription != expectedItem.CachedRating.Reviews[j].RelativeTimeDescription)
                    return false;
            }
        }

        // Assert: PlacesClient should NOT have been called (all items served from cache)
        mockPlacesClient.Verify(
            pc => pc.GetRatingAsync(
                It.IsAny<string>(),
                It.IsAny<double>(),
                It.IsAny<double>(),
                It.IsAny<CancellationToken>()),
            Times.Never());

        return true;
    }
}
