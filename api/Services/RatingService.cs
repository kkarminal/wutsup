using System.Text.Json;

using Microsoft.Extensions.Logging;

using Wutsup.Api.Models;

namespace Wutsup.Api.Services;

public class RatingService : IRatingService
{
    private readonly IRatingCacheStore _cacheStore;
    private readonly IPlacesClient _placesClient;
    private readonly ILogger<RatingService> _logger;

    public RatingService(IRatingCacheStore cacheStore, IPlacesClient placesClient, ILogger<RatingService> logger)
    {
        _cacheStore = cacheStore;
        _placesClient = placesClient;
        _logger = logger;
    }

    public async Task<RatingData?> GetRatingForItemAsync(int discoveryItemId, string name, double latitude, double longitude, CancellationToken ct = default)
    {
        // Check cache first — graceful degradation if cache is unreachable
        RatingCacheEntry? cacheEntry = null;
        try
        {
            cacheEntry = await _cacheStore.GetAsync(discoveryItemId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache read failed for discovery item {DiscoveryItemId}. Falling back to Places API.", discoveryItemId);
        }

        if (cacheEntry is not null)
        {
            // Cache hit — deserialize and return without calling PlacesClient
            var cachedData = JsonSerializer.Deserialize<RatingData>(cacheEntry.RatingDataJson);
            return cachedData;
        }

        // Cache miss (or cache failure) — call PlacesClient with graceful degradation
        PlacesDetailResult? placesResult;
        try
        {
            placesResult = await _placesClient.GetRatingAsync(name, latitude, longitude, ct);
        }
        catch (Exception ex)
        {
            // Graceful degradation: return null on any PlacesClient failure
            _logger.LogError(ex, "PlacesClient failed for discovery item {DiscoveryItemId} (name: {Name}).", discoveryItemId, name);
            return null;
        }

        if (placesResult is null)
            return null;

        var ratingData = new RatingData(placesResult.Rating, placesResult.ReviewCount, placesResult.Reviews);

        // Store in cache with default TTL — swallow exceptions on write failure
        try
        {
            await _cacheStore.SetAsync(discoveryItemId, ratingData, TimeSpan.FromMinutes(1440), ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cache write failed for discovery item {DiscoveryItemId}. Returning rating data without caching.", discoveryItemId);
        }

        return ratingData;
    }

    public async Task<List<EnrichedDiscoveryItemDto>> EnrichItemsAsync(List<DiscoveryItemDto> items, CancellationToken ct = default)
    {
        var enrichedItems = new List<EnrichedDiscoveryItemDto>();

        foreach (var item in items)
        {
            var (ratingData, hours, busyTimes) = await GetPlacesDataForItemAsync(item.Id, item.Name, item.Latitude, item.Longitude, ct);

            enrichedItems.Add(new EnrichedDiscoveryItemDto(
                item.Id,
                item.Name,
                item.Description,
                item.Latitude,
                item.Longitude,
                item.City,
                item.Address,
                item.ImageUrl,
                item.NavigationNodeId,
                item.CategoryLabel,
                item.Metadata,
                ratingData,
                hours,
                busyTimes));
        }

        return enrichedItems;
    }

    /// <summary>
    /// Returns rating data, hours, and busy times for a discovery item.
    /// Uses cache for rating data. Hours and busy times are extracted from PlacesDetailResult
    /// on cache miss; on cache hit they are returned as null (not cached).
    /// </summary>
    private async Task<(RatingData? Rating, HoursData? Hours, BusyTimesData? BusyTimes)> GetPlacesDataForItemAsync(
        int discoveryItemId, string name, double latitude, double longitude, CancellationToken ct = default)
    {
        // Check cache first for rating data
        RatingCacheEntry? cacheEntry = null;
        try
        {
            cacheEntry = await _cacheStore.GetAsync(discoveryItemId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache read failed for discovery item {DiscoveryItemId}. Falling back to Places API.", discoveryItemId);
        }

        if (cacheEntry is not null)
        {
            // Cache hit — return cached rating data; hours and busy times are not cached
            var cachedRating = System.Text.Json.JsonSerializer.Deserialize<RatingData>(cacheEntry.RatingDataJson);
            return (cachedRating, null, null);
        }

        // Cache miss — call PlacesClient for all data
        PlacesDetailResult? fullResult;
        try
        {
            fullResult = await _placesClient.GetRatingAsync(name, latitude, longitude, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PlacesClient failed for discovery item {DiscoveryItemId} (name: {Name}).", discoveryItemId, name);
            return (null, null, null);
        }

        if (fullResult is null)
            return (null, null, null);

        var ratingData = new RatingData(fullResult.Rating, fullResult.ReviewCount, fullResult.Reviews);

        // Store rating data in cache — hours and busy times are not cached
        try
        {
            await _cacheStore.SetAsync(discoveryItemId, ratingData, TimeSpan.FromMinutes(1440), ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cache write failed for discovery item {DiscoveryItemId}. Returning data without caching.", discoveryItemId);
        }

        return (ratingData, fullResult.Hours, fullResult.BusyTimes);
    }
}
